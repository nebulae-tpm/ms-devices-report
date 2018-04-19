'use strict'

const Rx = require('rxjs');
const Event = require('@nebulae/event-store').Event;
const DeviceGeneralInformationDA = require('../data/DeviceGeneralInformationDA');
const deepEqual = require('deep-equal');
const eventSourcing = require('../tools/EventSourcing')();
const camelCase = require('camelcase');
const nmea = require('node-nmea')

class DeviceStatefulEventsGenerator {

    /**
     * Returns an observable that will emit Events related to the Device current state (based on the materialized view)
     * @param {Event} evt the incoming event
     * @param {*} report the formatted event data: decompressed
     * @param {*} storedInfo the materialized view stored in db
     */
    static getGenerator$(evt, report, storedInfo) {
        return Rx.Observable.merge(
            this.temperatureAlarmEventGenerator$(evt, report, storedInfo),
            this.cpuAlarmEventGenerator$(evt, report, storedInfo),
            this.connectedEventGenerator$(evt, report, storedInfo, true),
            //this.volumesAlarmEventGenerator$(evt, report, storedInfo),
        );

        //Volumes alarms: on state.volumes
        //temperature alarm: on  state.device
        //CPU alarm: on state.system
    }

    /**
     * Generates an observable that emits DeviceAlarmActivated or DeviceAlarmDeactivated based on the temperature
     * @param {Event} evt the incoming event
     * @param {*} report the formatted event data: decompressed
     * @param {*} storedInfo the materialized view stored in db
     */
    static temperatureAlarmEventGenerator$(evt, report, storedInfo) {
        if (!report.state.system || report.state.system.temperature === undefined) {
            return Rx.Observable.empty();
        }
        const maxTemp = process.env.DEVICE_ALARM_TEMPERATURE_MAX || 60;
        const currentTemp = report.state.system.temperature;
        const alarmOn = currentTemp > maxTemp;

        if (storedInfo.temperatureAlarmOn === alarmOn) {
            return Rx.Observable.empty();
        }

        const eventType = (alarmOn) ? 'DeviceAlarmActivated' : 'DeviceAlarmDeactivated'
        const properties = [{ key: 'temperatureAlarmOn', value: alarmOn }];
        return DeviceGeneralInformationDA.updateDeviceGenearlInformation$(evt.aid, properties, evt.av, evt.timestamp)
            .mergeMap(result => {
                return (result.modifiedCount > 0 || result.upsertedCount > 0)
                    ? Rx.Observable.of(alarmOn)
                    : Rx.Observable.throw(
                        new Error(`DeviceGeneralInformationDA.updateDeviceGenearlInformation$ did not update any document: ${JSON.stringify({ sn: evt.aid, properties, aggregateVersion: evt.av, aggregateVersionTimestamp: evt.timestamp })}`));
            })
            .map(evt => {
                return new Event({
                    eventType,
                    eventTypeVersion: 1,
                    aggregateType: 'Device',
                    aggregateId: evt.aid,
                    data: {
                        type: 'TEMPERATURE',
                        value: currentTemp,
                        unit: 'C',
                        timestamp: report.timestamp
                    },
                    user: "SYSTEM.DevicesReport.devices-report-handler"
                });
            });
    }


    /**
     * Generates an observable that emits DeviceAlarmActivated or DeviceAlarmDeactivated based on the CPU usage
     * @param {Event} evt the incoming event
     * @param {*} report the formatted event data: decompressed
     * @param {*} storedInfo the materialized view stored in db
     */
    static cpuAlarmEventGenerator$(evt, report, storedInfo) {
        if (!report.state.system || report.state.system.cpuStatus === undefined) {
            return Rx.Observable.empty();
        }
        const maxCpuUsage = process.env.DEVICE_ALARM_CPU_USAGE_PERCENTAGE_MAX || 50;
        const currentUsage = Math.max(report.state.system.cpuStatus[0], report.state.system.cpuStatus[1]);
        const alarmOn = currentUsage > maxCpuUsage;

        if (storedInfo.temperatureAlarmOn === alarmOn) {
            return Rx.Observable.empty();
        }

        const eventType = (alarmOn) ? 'DeviceAlarmActivated' : 'DeviceAlarmDeactivated'
        const properties = [{ key: 'cpuUsageAlarmOn', value: alarmOn }];
        return DeviceGeneralInformationDA.updateDeviceGenearlInformation$(evt.aid, properties, evt.av, evt.timestamp)
            .mergeMap(result => {
                return (result.modifiedCount > 0 || result.upsertedCount > 0)
                    ? Rx.Observable.of(alarmOn)
                    : Rx.Observable.throw(
                        new Error(`DeviceGeneralInformationDA.updateDeviceGenearlInformation$ did not update any document: ${JSON.stringify({ sn: evt.aid, properties, aggregateVersion: evt.av, aggregateVersionTimestamp: evt.timestamp })}`));
            })
            .map(evt => {
                return new Event({
                    eventType,
                    eventTypeVersion: 1,
                    aggregateType: 'Device',
                    aggregateId: evt.aid,
                    data: {
                        type: 'CPU_USAGE',
                        value: currentUsage,
                        unit: '%',
                        timestamp: report.timestamp
                    },
                    user: "SYSTEM.DevicesReport.devices-report-handler"
                });
            });
    }

    /**
     * Generates an observable that emits DeviceConnected
     * @param {Event} evt the incoming event
     * @param {*} report the formatted event data: decompressed
     * @param {*} storedInfo the materialized view stored in db
     */
    static connectedEventGenerator$(evt, report, storedInfo, connected) {
        if (storedInfo.connected === connected) {
            return Rx.Observable.empty();
        }

        const eventType = 'DeviceConnected';
        const properties = [{ key: 'connected', value: connected }];
        return DeviceGeneralInformationDA.updateDeviceGenearlInformation$(evt.aid, properties, evt.av, evt.timestamp)
            .mergeMap(result => {
                return (result.modifiedCount > 0 || result.upsertedCount > 0)
                    ? Rx.Observable.of(connected)
                    : Rx.Observable.throw(
                        new Error(`DeviceGeneralInformationDA.updateDeviceGenearlInformation$ did not update any document: ${JSON.stringify({ sn: evt.aid, properties, aggregateVersion: evt.av, aggregateVersionTimestamp: evt.timestamp })}`));
            })
            .map(evt => {
                return new Event({
                    eventType,
                    eventTypeVersion: 1,
                    aggregateType: 'Device',
                    aggregateId: evt.aid,
                    data: {
                        connected: connected,
                        timestamp: report.timestamp
                    },
                    user: "SYSTEM.DevicesReport.devices-report-handler"
                });
            });
    }


}

module.exports = DeviceStatefulEventsGenerator;