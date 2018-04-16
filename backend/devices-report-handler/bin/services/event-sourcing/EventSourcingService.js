const Rx = require('rxjs');
const deviceGeneralInformation = require('../../domain/DeviceGeneralInformation')();

/**
 * Singleton instance
 */
let instance;

class EventSourcingService{
    constructor(){

    }

    /**
     * Generates a map that assocs each Event with its handler
     */
    generateFunctionMap() {
        return {
            'DeviceGeneralInformationReported': deviceGeneralInformation.handle
        };
    }
}



module.exports = () => {
    if (!instance) {
        instance = new EventSourcingService();
        console.log('EventSourcingService Singleton created');
    }
    return instance;
};