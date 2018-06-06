'use strict'

const Rx = require('rxjs');
const Event = require('@nebulae/event-store').Event;
const DeviceGeneralInformationDA = require('../data/DeviceGeneralInformationDA');
const eventSourcing = require('../tools/EventSourcing')();

let instance;

class EvalDisconnectedDevicesJob {

    constructor() {

    }

    /**
     * handle DeviceGeneralInformation eventcd -
     * 
     * @param {Event} event 
     */
    handleEvalDisconnectedDevicesJobTriggeredEvent$(event) {

        const eventType = 'DeviceConnected';
        const properties = [{ key: 'connected', value: false }];

        //1 - query DB for devices that have not sent data in a while
        //2 - update each device to indicate is offline
        //3 - generate and emit event (of type DeviceConnected)
        return Rx.Observable.of(event)
            .mergeMap(evt => DeviceGeneralInformationDA.getConnectedDevicesThatHaventSentDataForMinutes$(evt.threshold))
            .mergeMap(device =>
                DeviceGeneralInformationDA.updateDeviceGenearlInformation$(device.sn, properties)
                    .mapTo(device))
            .map(device => {
                return new Event({
                    eventType,
                    eventTypeVersion: 1,
                    aggregateType: 'Device',
                    aggregateId: device.sn,
                    data: {
                        connected: false,
                        timestamp: event.timestamp,
                        lastCommTimestamp: device.lastCommTimestamp
                    },
                    user: "SYSTEM.DevicesReport.devices-report-handler"
                });
            })
            //now we can emit all generated events into the EventStore
            .mergeMap(event => eventSourcing.eventStore.emitEvent$(event))
            ;
    }

}

module.exports = () => {
    if (!instance) {
        instance = new EvalDisconnectedDevicesJob();
        console.log('EvalDisconnectedDevicesJob Singleton created');
    }
    return instance;
};