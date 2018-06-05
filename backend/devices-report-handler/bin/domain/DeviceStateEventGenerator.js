'use strict'

const Rx = require('rxjs');
const Event = require('@nebulae/event-store').Event;
const DeviceGeneralInformationDA = require('../data/DeviceGeneralInformationDA');
const deepEqual = require('deep-equal');
const eventSourcing = require('../tools/EventSourcing')();
const camelCase = require('camelcase');
const nmea = require('node-nmea');
const ObjectTools = require('../tools/ObjectTools');

class DeviceStateEventGenerator {

    /**
     * Returns an observable that will emit Events related to the Device State
     * @param {Event} evt the incoming event
     * @param {*} report the formatted event data: decompressed
     * @param {*} storedInfo the materialized view stored in db
     */
    static getGenerator$(evt, report, storedInfo) {
        return Rx.Observable.of(
            //we start by getting the list of state difference between the new event and the persisted materialized view
            this.compareAndGetStateDifferences(evt, report, storedInfo))
            //then we try to apply all theses changes into the materialized view
            .mergeMap(({ sn, properties, aggregateVersion, aggregateVersionTimestamp }) =>
                DeviceGeneralInformationDA.updateDeviceGenearlInformation$(sn, properties, aggregateVersion, aggregateVersionTimestamp)
                    .mergeMap(result => {
                        return Rx.Observable.of({ sn, properties, aggregateVersion, aggregateVersionTimestamp });
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
    static compareAndGetStateDifferences(evt, report, storedInfo) {
        const reportTimestamp = report.timestamp;
        delete report.state.timestamp;
        const diffs = [];
        Object.keys(report.state).forEach(key => {
            if (ObjectTools.isObject(storedInfo[key])) {
                delete storedInfo[key].timestamp;
                ObjectTools.clean(storedInfo[key]);
            }

            if (!deepEqual(report.state[key], storedInfo[key])) {
                let diff;
                if (!Array.isArray(report.state[key])) {
                    diff = { key, value: { ...report.state[key], timestamp: reportTimestamp } };
                } else {
                    diff = { key, value: report.state[key] }
                }
                diffs.push(diff);
            }
        });
        return { sn: evt.aid, properties: diffs, aggregateVersion: evt.av, aggregateVersionTimestamp: evt.timestamp };
    }

    
}

module.exports = DeviceStateEventGenerator;