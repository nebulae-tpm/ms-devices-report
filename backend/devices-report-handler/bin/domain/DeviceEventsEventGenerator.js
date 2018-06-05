'use strict'

const Rx = require('rxjs');
const Event = require('@nebulae/event-store').Event;
const DeviceGeneralInformationDA = require('../data/DeviceGeneralInformationDA');
const deepEqual = require('deep-equal');
const eventSourcing = require('../tools/EventSourcing')();
const camelCase = require('camelcase');
const nmea = require('node-nmea')

class DeviceEventsEventGenerator {

    /**
     * Returns an observable that will emit Events related to the Device Events
     * @param {Event} incomingEvent the incoming event
     * @param {*} report the formatted event data: decompressed
     * @param {*} storedInfo the materialized view stored in db
     */
    static getGenerator$(incomingEvent, report, storedInfo) {
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
    static deviceLocationReportedEventGenerator$(evt, report, storedInfo) {
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
    }



    /**
     * Returns an observable that will emit DeviceLowestVoltageReported
     * @param {*} evt incoming nested event
     * @param {*} report the formatted event data: decompressed
     * @param {*} storedInfo the materialized view stored in db
     */
    static deviceLowestVoltageReportedEventGenerator$(evt, report, storedInfo) {
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
    static deviceHighestVoltageReportedEventGenerator$(evt, report, storedInfo) {
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
    static deviceVoltageAlarmReportedEventGenerator$(evt, report, storedInfo) {
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
    static deviceMainAppUsosTranspCountReportedEventGenerator$(evt, report, storedInfo) {
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
    static deviceMainAppErrsTranspCountReportedEventGenerator$(evt, report, storedInfo) {
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
}

module.exports = DeviceEventsEventGenerator;