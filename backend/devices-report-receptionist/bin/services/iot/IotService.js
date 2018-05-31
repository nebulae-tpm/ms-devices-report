'use strict'

const Rx = require('rxjs');
const BrockerFactory = require('../../tools/broker/BrokerFactory');
const deviceGeneralInformation = undefined;
const IoTServiceHelper = require('./IoTServiceHelper');

let instance;

class IotService {

    constructor() {        
        this.broker = new BrockerFactory(process.env.IOT_BROKER_TYPE).getBroker();
        deviceGeneralInformation = require('../../domain/DeviceGeneralInformation')();
    }

    start$() {
        return Rx.Observable.create(observer => {
            this.subscription = this.processIncomingMessages$()
                .subscribe(
                    ({ storeResult, brokerResult }) => {
                        // console.log(
                        //     `IotService proccesed incoming mesage;\n
                        //     storeResult: ${JSON.stringify(storeResult)}\n
                        //     brokerResult: ${JSON.stringify(brokerResult)}\n
                        // `);
                    },
                    (error) => {
                        console.error(`IotService failed to proccess incoming msg`, error);
                        process.exit(1);
                    },
                    () => console.log('IotService stopped')
                );
            observer.next('IotService listening messages')
            observer.complete();
        });
    }

    processIncomingMessages$() {
        const streamSource = this.broker.getMessageListener$([process.env.IOT_BROKER_TOPIC])
            .map(msg => msg.data)
            .filter(data => data && data.state && data.state.sDv);
        return IoTServiceHelper.ensureOrderedStream$(streamSource)
            .concatMap(data => deviceGeneralInformation.handleReportDeviceGeneralInformation$(data));
    }

    

    stop$s() {
        return Rx.Observable.create(observer => {
            this.subscription.unsubscribe();
            observer.next('IotService stopped listening to messages')
            observer.complete();
        });

    }


}

module.exports = () => {
    if (!instance) {
        instance = new IotService();
        console.log('IotService Singleton created');
    }
    return instance;
};