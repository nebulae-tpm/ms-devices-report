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
            this.volumesAlarmEventGenerator$(evt, report, storedInfo),
            this.ramAlarmEventGenerator$(evt, report, storedInfo),
        );

        //Volumes alarms: on state.volumes
        //temperature alarm: on  state.device
        //CPU alarm: on state.system
    }

    /**
     * Generates an observable that emits DeviceTemperatureAlarmActivated or DeviceTemperatureAlarmDeactivated based on the temperature
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

        const eventType = (alarmOn) ? 'DeviceTemperatureAlarmActivated' : 'DeviceTemperatureAlarmDeactivated'
        const properties = [{ key: 'temperatureAlarmOn', value: alarmOn }];
        return DeviceGeneralInformationDA.updateDeviceGenearlInformation$(evt.aid, properties, evt.av, evt.timestamp)
            .mergeMap(result => {
                return (result.modifiedCount > 0 || result.upsertedCount > 0)
                    ? Rx.Observable.of(alarmOn)
                    : Rx.Observable.throw(
                        new Error(`DeviceGeneralInformationDA.updateDeviceGenearlInformation$ did not update any document: ${JSON.stringify({ sn: evt.aid, properties, aggregateVersion: evt.av, aggregateVersionTimestamp: evt.timestamp })}`));
            })
            .map(alarmOn => {
                return new Event({
                    eventType,
                    eventTypeVersion: 1,
                    aggregateType: 'Device',
                    aggregateId: evt.aid,
                    data: {
                        value: currentTemp,
                        unit: 'C',
                        timestamp: report.timestamp
                    },
                    user: "SYSTEM.DevicesReport.devices-report-handler"
                });
            });
    }


    /**
     * Generates an observable that emits DeviceCpuUsageAlarmActivated or DeviceCpuUsageAlarmDeactivated based on the CPU usage
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

        if (storedInfo.cpuUsageAlarmOn === alarmOn) {
            return Rx.Observable.empty();
        }

        const eventType = (alarmOn) ? 'DeviceCpuUsageAlarmActivated' : 'DeviceCpuUsageAlarmDeactivated'
        const properties = [{ key: 'cpuUsageAlarmOn', value: alarmOn }];
        return DeviceGeneralInformationDA.updateDeviceGenearlInformation$(evt.aid, properties, evt.av, evt.timestamp)
            .mergeMap(result => {
                return (result.modifiedCount > 0 || result.upsertedCount > 0)
                    ? Rx.Observable.of(alarmOn)
                    : Rx.Observable.throw(
                        new Error(`DeviceGeneralInformationDA.updateDeviceGenearlInformation$ did not update any document: ${JSON.stringify({ sn: evt.aid, properties, aggregateVersion: evt.av, aggregateVersionTimestamp: evt.timestamp })}`));
            })
            .map(alarmOn => {
                return new Event({
                    eventType,
                    eventTypeVersion: 1,
                    aggregateType: 'Device',
                    aggregateId: evt.aid,
                    data: {
                        value: currentUsage,
                        unit: '%',
                        timestamp: report.timestamp
                    },
                    user: "SYSTEM.DevicesReport.devices-report-handler"
                });
            });
    }

    /**
     * Generates an observable that emits DeviceRamuUsageAlarmActivated or DeviceRamUsageAlarmDeactivated based on the CPU usage
     * @param {Event} evt the incoming event
     * @param {*} report the formatted event data: decompressed
     * @param {*} storedInfo the materialized view stored in db
     */
    static ramAlarmEventGenerator$(evt, report, storedInfo) {
        if (!report.state.system || report.state.system.ram === undefined) {
            return Rx.Observable.empty();
        }
        const maxRamUsage = process.env.DEVICE_ALARM_RAM_USAGE_PERCENTAGE_MAX || 70;
        const currentUsage = Math.round((report.state.system.ram.current / report.state.system.ram.total) * 100);
        
        const alarmOn = currentUsage > maxRamUsage;

        if (storedInfo.ramUsageAlarmOn === alarmOn) {
            return Rx.Observable.empty();
        }

        const eventType = (alarmOn) ? 'DeviceRamuUsageAlarmActivated' : 'DeviceRamUsageAlarmDeactivated'
        const properties = [{ key: 'ramUsageAlarmOn', value: alarmOn }];
        return DeviceGeneralInformationDA.updateDeviceGenearlInformation$(evt.aid, properties, evt.av, evt.timestamp)
            .mergeMap(result => {
                return (result.modifiedCount > 0 || result.upsertedCount > 0)
                    ? Rx.Observable.of(alarmOn)
                    : Rx.Observable.throw(
                        new Error(`DeviceGeneralInformationDA.updateDeviceGenearlInformation$ did not update any document: ${JSON.stringify({ sn: evt.aid, properties, aggregateVersion: evt.av, aggregateVersionTimestamp: evt.timestamp })}`));
            })
            .map(alarmOn => {
                return new Event({
                    eventType,
                    eventTypeVersion: 1,
                    aggregateType: 'Device',
                    aggregateId: evt.aid,
                    data: {
                        value: currentUsage,
                        unit: '%',
                        timestamp: report.timestamp
                    },
                    user: "SYSTEM.DevicesReport.devices-report-handler"
                });
            });
    }

    /**
     * Generates an observable that emits Device[SD]UsageAlarmActivated or Device[SD]UsageAlarmDeactivated based on the CPU usage
     * @param {Event} evt the incoming event
     * @param {*} report the formatted event data: decompressed
     * @param {*} storedInfo the materialized view stored in db
     */
    static volumesAlarmEventGenerator$(evt, report, storedInfo) {
        if (!report.state.volumes) {
            return Rx.Observable.empty();
        }
        const maxVolumeUsage = process.env.DEVICE_ALARM_VOLUME_USAGE_PERCENTAGE_MAX || 70;

        return Rx.Observable.from(report.state.volumes)
            .map(volume => {
                const currentUsage = Math.round((volume.current / volume.total) * 100);
                const alarmOn = currentUsage > maxVolumeUsage;
                return {
                    currentUsage, alarmOn, volume
                };
            })
            .mergeMap(diagnostic => (storedInfo[`${diagnostic.volume.type}VolumeUsageAlarmOn`] === diagnostic.alarmOn)
                ? Rx.Observable.empty()
                : Rx.Observable.of(diagnostic))
            .mergeMap(({ currentUsage, alarmOn, volume }) => {
                const eventType = (alarmOn) ? camelCase(`Device ${volume.type} Usage Alarm Activated`, { pascalCase: true }) : camelCase(`Device ${volume.type} Usage Alarm Deactivated`, { pascalCase: true })
                const properties = [{ key: `${volume.type}VolumeUsageAlarmOn`, value: alarmOn }];
                return DeviceGeneralInformationDA.updateDeviceGenearlInformation$(evt.aid, properties, evt.av, evt.timestamp)
                    .mergeMap(result => {
                        return (result.modifiedCount > 0 || result.upsertedCount > 0)
                            ? Rx.Observable.of({ eventType, currentUsage, alarmOn, volume })
                            : Rx.Observable.throw(
                                new Error(`DeviceGeneralInformationDA.updateDeviceGenearlInformation$ did not update any document: ${JSON.stringify({ sn: evt.aid, properties, aggregateVersion: evt.av, aggregateVersionTimestamp: evt.timestamp })}`));
                    })
            })
            .map(({ eventType, currentUsage, alarmOn, volume }) => {
                return new Event({
                    eventType,
                    eventTypeVersion: 1,
                    aggregateType: 'Device',
                    aggregateId: evt.aid,
                    data: {
                        value: currentUsage,
                        unit: '%',
                        timestamp: report.timestamp,

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
            .map(connected => {
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