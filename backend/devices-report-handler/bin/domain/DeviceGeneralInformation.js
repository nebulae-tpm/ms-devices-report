'use strict'

const Rx = require('rxjs');
const Event = require('@nebulae/event-store').Event;
const DeviceGeneralInformationFormatter = require('./DeviceGeneralInformationFormatter');
const DeviceStateEventGenerator = require('./DeviceStateEventGenerator');
const DeviceEventsEventGenerator = require('./DeviceEventsEventGenerator');
const DeviceStatefulEventsGenerator = require('./DeviceStatefulEventsGenerator');
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
            DeviceGeneralInformationFormatter.formatReport$(event.data),
            DeviceGeneralInformationDA.getDeviceGeneralInformation$(event.aid).map(storedInfo => storedInfo ? storedInfo : {}))
            //Now lets start the events generators in parrallel:
            // 1 - Device State reports
            // 1 - Device Events reports
            .mergeMap(([evt, report, storedInfo]) =>
                Rx.Observable.merge(
                    DeviceStateEventGenerator.getGenerator$(evt, report, storedInfo),
                    DeviceEventsEventGenerator.getGenerator$(evt, report, storedInfo),
                    DeviceStatefulEventsGenerator.getGenerator$(evt, report, storedInfo)
                )
            )
            //now we can emit all generated events into the EventStore
            .mergeMap(event => eventSourcing.eventStore.emitEvent$(event))
            ;
    }

}

module.exports = () => {
    if (!instance) {
        instance = new DeviceGeneralInformation();
        console.log('EventSourcingService Singleton created');
    }
    return instance;
};