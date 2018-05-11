'use strict'

const Rx = require('rxjs');
const eventSourcing = require('../tools/EventSourcing')();
const Event = require('@nebulae/event-store').Event;


let instance;

class DeviceGeneralInformation {

    constructor() {
        
    }

    /**
     * handle DeviceGeneralInformation event
     * @param {*} command 
     */
    handleReportDeviceGeneralInformation$(report) {
        try {
            const event = new Event({
                eventType: 'DeviceGeneralInformationReported',
                eventTypeVersion: report.v,
                aggregateType: 'Device',
                aggregateId: report.state.sDv,
                data: report,
                user: 'devices-report-receptionist'
            });
            return eventSourcing.eventStore.emitEvent$(event);
        }
        catch (error) { 
            console.log(error);
            return Rx.Observable.of(undefined);
        }
    }
}

module.exports = () => {
    if (!instance) {
        instance = new DeviceGeneralInformation();
        console.log('DeviceGeneralInformation Singleton created');
    }
    return instance;
};