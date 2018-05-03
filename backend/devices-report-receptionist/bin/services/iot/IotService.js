'use strict'

const Rx = require('rxjs');
const BrockerFactory = require('../../tools/broker/BrokerFactory');
const deviceGeneralInformation = require('../../domain/DeviceGeneralInformation')();

let instance;

class IotService {

    constructor() {
        this.broker = new BrockerFactory(process.env.IOT_BROKER_TYPE).getBroker();
    }

    start$() {
        return Rx.Observable.create(observer => {
            this.subscription = this.broker.getMessageListener$([process.env.IOT_BROKER_TOPIC])
                .map(msg => msg.data)
                .concatMap(data => deviceGeneralInformation.handleReportDeviceGeneralInformation$(data))
                .subscribe(
                    ({ storeResult, brokerResult }) => {
                        console.log(
                            `IotService proccesed incoming mesage;\n
                            storeResult: ${JSON.stringify(storeResult)}\n
                            brokerResult: ${JSON.stringify(brokerResult)}\n
                        `);
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