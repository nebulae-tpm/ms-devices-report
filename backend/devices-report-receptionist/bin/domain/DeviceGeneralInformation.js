const Rx = require('rxjs');
const nebulaeES = ('@nebulae/event-store');
const Event = nebulaeES.Event;
const EventStore = nebulaeES.EventStore;

let instance;

class DeviceGeneralInformation {

    constructor() {
        this.eventStore = new EventStore(
            {
                type = process.env.EVENT_STORE_BROKER_TYPE,
                eventsTopic= process.env.EVENT_STORE_BROKER_EVENTS_TOPIC,
                brokerUrl= process.env.EVENT_STORE_BROKER_URL,
                projectId= process.env.EVENT_STORE_BROKER_PROJECT_ID,
            },
            {
                type: process.env.EVENT_STORE_STORE_TYPE,
                url: process.env.EVENT_STORE_STORE_URL,
                eventStoreDbName: process.env.EVENT_STORE_STORE_EVENTSTORE_DB_NAME,
                aggregatesDbName: process.env.EVENT_STORE_STORE_AGGREGATES_DB_NAME
            }
        );
    }

    /**
     * handle DeviceGeneralInformation event
     * @param {*} command 
     */
    handleReportDeviceGeneralInformation$(report) {
        const event = new Event({
            eventType: 'DeviceGeneralInformationReported',
            eventTypeVersion: report.v,
            aggregateType: 'Device',
            aggregateId: report.state.sDv,
            data: report,
            user: 'devices-report-receptionist'
        });
        return this.eventStore.emitEvent$(event);        
    }
}

module.exports = () => {
    if (!instance) {
        instance = new DeviceGeneralInformation();
        console.log('DeviceGeneralInformation Singleton created');
    }
    return instance;
};