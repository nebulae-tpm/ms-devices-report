'use strict'

const Rx = require('rxjs');
const Event = require('@nebulae/event-store').Event;
const Helper = require('./DeviceGeneralInformationHelper');
const DeviceGeneralInformationDA = require('../data/DeviceGeneralInformationDA');
const deepEqual = require('deep-equal');
const eventSourcing = require('../tools/EventSourcing')();
const camelCase = require('camelcase');

let instance;

class DeviceGeneralInformation {

    constructor() {

    }

    /**
     * handle DeviceGeneralInformation event
     * @param {Event} event 
     */
    handleDeviceGeneralInformationReportedEvent$(event) {
        //console.log(JSON.stringify(event));   
        return Rx.Observable.forkJoin(
            Rx.Observable.of(event),
            this.formatReport$(event.data),
            DeviceGeneralInformationDA.getDeviceGeneralInformation$(event.aid).map(storedInfo => storedInfo ? storedInfo : {})
        )
            .map(([evt, report, storedInfo]) => this.findDifferentProperties(evt, report, storedInfo))
            .mergeMap(({ sn, properties, aggregateVersion, aggregateVersionTimestamp }) =>
                DeviceGeneralInformationDA.updateDeviceGenearlInformation$(sn, properties, aggregateVersion, aggregateVersionTimestamp)
                    .mergeMap(result => result.modifiedCount > 0
                        ? Rx.Observable.of({ sn, properties, aggregateVersion, aggregateVersionTimestamp })
                        : Rx.Observable.throw(
                            new Error(`DeviceGeneralInformationDA.updateDeviceGenearlInformation$ did not update any document: ${
                                JSON.stringify({ sn, properties, aggregateVersion, aggregateVersionTimestamp })}`))))
            .mergeMap(({ sn, properties, aggregateVersion, aggregateVersionTimestamp }) =>
                Rx.Observable.from(properties)
                    .map(property => { return { sn, property, aggregateVersion, aggregateVersionTimestamp }; }))
            .mergeMap(({ sn, property, aggregateVersion, aggregateVersionTimestamp }) =>
                eventSourcing.eventStore.emitEvent$(new Event(
                    {
                        eventType: `${camelCase(`Device ${property.key} State Reported`, { pascalCase: true })}`,
                        eventTypeVersion: 1,
                        aggregateType: 'Device',
                        aggregateId: sn,
                        data: property.value,
                        user: "SYSTEM.DevicesReport.devices-report-handler",
                        aggregateVersion
                    }
                )))



            ;
    }

    /**
     * Decompress DeviceGeneralInformation report and format it to the standard format
     * @param {Object} compressedReport 
     */
    formatReport$(compressedReport) {
        return Rx.Observable.of(compressedReport)
            .map(unformatted => Helper.formatIncomingReport(unformatted))
    }

    findDifferentProperties(evt, report, storedInfo) {
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



}

module.exports = () => {
    if (!instance) {
        instance = new DeviceGeneralInformation();
        console.log('EventSourcingService Singleton created');
    }
    return instance;
};