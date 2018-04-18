'use strict'

const Rx = require('rxjs');
const Event = require('@nebulae/event-store').Event;
const Helper = require('./DeviceGeneralInformationHelper');
const DeviceGeneralInformationDA = require('../data/DeviceGeneralInformationDA');
const deepEqual = require('deep-equal');
const eventSourcing = require('../tools/EventSourcing')();
const camelCase = require('camelcase');
const nmea = require('node-nmea')

let instance;

class DeviceGeneralInformation {

    constructor() {

    }

    /**
     * handle DeviceGeneralInformation eventcd -
     * 
     * @param {Event} event 
     */
    handleDeviceGeneralInformationReportedEvent$(event) {
        //First lets gather all the needed info: 
        //  - the incoming event
        //  - the formatted event data: decompressed
        //  - the materialized view stored in db
        return Rx.Observable.forkJoin(
            Rx.Observable.of(event),
            this.formatReport$(event.data),
            DeviceGeneralInformationDA.getDeviceGeneralInformation$(event.aid).map(storedInfo => storedInfo ? storedInfo : {}))
            //Now lets start the events generators in parrallel:
            // 1 - Device State reports
            // 1 - Device Events reports
            .mergeMap(([evt, report, storedInfo]) =>
                Rx.Observable.merge(
                    this.deviceStateEventGenerator$(evt, report, storedInfo),
                    this.deviceEventsEventGenerator$(evt, report, storedInfo)
                )
            )
            //now we can emit all generated events into the EventStore
            .mergeMap(event => eventSourcing.eventStore.emitEvent$(event))
            ;
    }


    /**
     * Returns an observable that will emit Events related to the Device State
     * @param {Event} evt the incoming event
     * @param {*} report the formatted event data: decompressed
     * @param {*} storedInfo the materialized view stored in db
     */
    deviceStateEventGenerator$(evt, report, storedInfo) {
        return Rx.Observable.of(
            //we start by getting the list of state difference between the new event and the persisted materialized view
            this.compareAndGetStateDifferences(evt, report, storedInfo))
            //then we try to apply all theses changes into the materialized view
            .mergeMap(({ sn, properties, aggregateVersion, aggregateVersionTimestamp }) =>
                DeviceGeneralInformationDA.updateDeviceGenearlInformation$(sn, properties, aggregateVersion, aggregateVersionTimestamp)
                    .mergeMap(result => {
                        return (result.modifiedCount > 0 || result.upsertedCount > 0)
                            ? Rx.Observable.of({ sn, properties, aggregateVersion, aggregateVersionTimestamp })
                            : Rx.Observable.throw(
                                new Error(`DeviceGeneralInformationDA.updateDeviceGenearlInformation$ did not update any document: ${JSON.stringify({ sn, properties, aggregateVersion, aggregateVersionTimestamp })}`));
                    }))
            // now lets split the changed properties and emit them one by one
            .mergeMap(({ sn, properties, aggregateVersion, aggregateVersionTimestamp }) => {
                return Rx.Observable.from(properties)
                    .map(property => { return { sn, property, aggregateVersion, aggregateVersionTimestamp }; });
            })
            //now we can create a new Event per changed property
            .map(({ sn, property, aggregateVersion, aggregateVersionTimestamp }) => {
                return new Event(
                    {
                        eventType: `${camelCase(`Device ${property.key} State Reported`, { pascalCase: true })}`,
                        eventTypeVersion: 1,
                        aggregateType: 'Device',
                        aggregateId: sn,
                        data: property.value,
                        user: "SYSTEM.DevicesReport.devices-report-handler"
                    }
                );
            })
    }

    /**
     * Compare state properties diffs and return them 
     * @param {Event} evt 
     * @param {*} report 
     * @param {*} storedInfo 
     */
    compareAndGetStateDifferences(evt, report, storedInfo) {
        const reportTimestamp = report.timestamp;
        delete report.state.timestamp;
        const diffs = [];
        Object.keys(report.state).forEach(key => {
            if (!deepEqual(report.state[key], storedInfo[key])) {
                diffs.push({ key, value: report.state[key] });
            }
        });
        return { sn: evt.aid, properties: diffs, aggregateVersion: evt.av, aggregateVersionTimestamp: evt.timestamp };
    }


    /**
     * Returns an observable that will emit Events related to the Device Events
     * @param {Event} incomingEvent the incoming event
     * @param {*} report the formatted event data: decompressed
     * @param {*} storedInfo the materialized view stored in db
     */
    deviceEventsEventGenerator$(incomingEvent, report, storedInfo) {
        if (!report.events) {
            return Rx.Observable.empty();
        }
        return Rx.Observable.from(report.events)
            .mergeMap(evt => {
                switch (evt.type) {
                    case 'GPRMC':
                        return this.deviceLocationReportedEventGenerator$(evt, report, storedInfo);
                    case 'lowest_volt':
                        return this.deviceLowestVoltageReportedEventGenerator$(evt, report, storedInfo);
                    case 'highest_volt':
                        return this.deviceHighestVoltageReportedEventGenerator$(evt, report, storedInfo);
                    case 'alert_volt':
                        return this.deviceVoltageAlarmReportedEventGenerator$(evt, report, storedInfo);
                    case 'usosTranspCount':
                        return this.deviceMainAppUsosTranspCountReportedEventGenerator$(evt, report, storedInfo);
                    case 'errsTranspCount':
                        return this.deviceMainAppErrsTranspCountReportedEventGenerator$(evt, report, storedInfo);
                    default:
                        return Rx.Observable.empty();
                }
            })
            ;
    }

    /**
     * Returns an observable that will emit DeviceLocationReported events
     * @param {*} evt incoming nested event
     * @param {*} report the formatted event data: decompressed
     * @param {*} storedInfo the materialized view stored in db
     */
    deviceLocationReportedEventGenerator$(evt, report, storedInfo) {
        const raw = evt.value;
        const nmeaData = nmea.parse(raw);
        if (!nmeaData.valid) {
            console.log(`Faliled to process device GPRMC event, data is not valid: ${raw}`);
            return Rx.Observable.empty();
        }
        return Rx.Observable.of(nmeaData)
            .map(data => {
                return {
                    loc: data.loc,
                    timestamp: evt.timestamp
                };
            })
            .map(data => {
                return new Event({
                    eventType: 'DeviceLocationReported',
                    eventTypeVersion: 1,
                    aggregateType: 'Device',
                    aggregateId: report.state.device.sn,
                    data,
                    user: "SYSTEM.DevicesReport.devices-report-handler"
                });
            });
        return Rx.Observable.empty();
    }



    /**
     * Returns an observable that will emit DeviceLowestVoltageReported
     * @param {*} evt incoming nested event
     * @param {*} report the formatted event data: decompressed
     * @param {*} storedInfo the materialized view stored in db
     */
    deviceLowestVoltageReportedEventGenerator$(evt, report, storedInfo) {
        return Rx.Observable.of(evt)
            .map(evt => {
                return new Event({
                    eventType: 'DeviceLowestVoltageReported',
                    eventTypeVersion: 1,
                    aggregateType: 'Device',
                    aggregateId: report.state.device.sn,
                    data: { voltage: evt.value, timestamp: evt.timestamp },
                    user: "SYSTEM.DevicesReport.devices-report-handler"
                });
            });
    }

    /**
     * Returns an observable that will emit DeviceHighestVoltageReported
     * @param {*} evt incoming nested event
     * @param {*} report the formatted event data: decompressed
     * @param {*} storedInfo the materialized view stored in db
     */
    deviceHighestVoltageReportedEventGenerator$(evt, report, storedInfo) {
        return Rx.Observable.of(evt)
            .map(evt => {
                return new Event({
                    eventType: 'DeviceHighestVoltageReported',
                    eventTypeVersion: 1,
                    aggregateType: 'Device',
                    aggregateId: report.state.device.sn,
                    data: { voltage: evt.value, timestamp: evt.timestamp },
                    user: "SYSTEM.DevicesReport.devices-report-handler"
                });
            });
    }

    /**
     * Returns an observable that will emit DeviceHeghestVoltageReported
     * @param {*} evt incoming nested event
     * @param {*} report the formatted event data: decompressed
     * @param {*} storedInfo the materialized view stored in db
     */
    deviceVoltageAlarmReportedEventGenerator$(evt, report, storedInfo) {
        const eventType = (evt.value < 12) ? 'DeviceLowVoltageAlarmReported' : 'DeviceHighVoltageAlarmReported'
        return Rx.Observable.of(evt)
            .map(evt => {
                return new Event({
                    eventType,
                    eventTypeVersion: 1,
                    aggregateType: 'Device',
                    aggregateId: report.state.device.sn,
                    data: { voltage: evt.value, timestamp: evt.timestamp },
                    user: "SYSTEM.DevicesReport.devices-report-handler"
                });
            });
    }

    /**
     * Returns an observable that will emit DeviceMainAppUsosTranspCountReported
     * @param {*} evt incoming nested event
     * @param {*} report the formatted event data: decompressed
     * @param {*} storedInfo the materialized view stored in db
     */
    deviceMainAppUsosTranspCountReportedEventGenerator$(evt, report, storedInfo) {
        return Rx.Observable.of(evt)
            .map(evt => {
                return new Event({
                    eventType: 'DeviceMainAppUsosTranspCountReported',
                    eventTypeVersion: 1,
                    aggregateType: 'Device',
                    aggregateId: report.state.device.sn,
                    data: { count: evt.value, timestamp: evt.timestamp },
                    user: "SYSTEM.DevicesReport.devices-report-handler"
                });
            });
    }

    /**
     * Returns an observable that will emit DeviceMainAppErrsTranspCountReported
     * @param {*} evt incoming nested event
     * @param {*} report the formatted event data: decompressed
     * @param {*} storedInfo the materialized view stored in db
     */
    deviceMainAppErrsTranspCountReportedEventGenerator$(evt, report, storedInfo) {
        return Rx.Observable.of(evt)
            .map(evt => {
                return new Event({
                    eventType: 'DeviceMainAppErrsTranspCountReported',
                    eventTypeVersion: 1,
                    aggregateType: 'Device',
                    aggregateId: report.state.device.sn,
                    data: { count: evt.value, timestamp: evt.timestamp },
                    user: "SYSTEM.DevicesReport.devices-report-handler"
                });
            });
    }


    /**
     * Decompress DeviceGeneralInformation report and format it to the standard format
     * @param {Object} compressedReport 
     */
    formatReport$(compressedReport) {
        return Rx.Observable.of(compressedReport)
            .map(unformatted => Helper.formatIncomingReport(unformatted))
    }

}

module.exports = () => {
    if (!instance) {
        instance = new DeviceGeneralInformation();
        console.log('EventSourcingService Singleton created');
    }
    return instance;
};