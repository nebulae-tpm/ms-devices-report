'use strict'

const Rx = require('rxjs');
const Event = require('@nebulae/event-store').Event;
const Helper = require('./DeviceGeneralInformationHelper');

let instance;

class DeviceGeneralInformation{

    constructor(){

    }

    /**
     * handle DeviceGeneralInformation event
     * @param {Event} event 
     */
    handleDeviceGeneralInformationReportedEvent$(event){
        console.log(JSON.stringify(event));
        return this.formatReport$(event.data);
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