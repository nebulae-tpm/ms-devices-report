const Rx = require('rxjs');
const deviceGeneralInformation = require('../../domain/DeviceGeneralInformation')();
const evalDisconnectedDevicesJob = require('../../domain/EvalDisconnectedDevicesJob')();
const eventSourcing = require('../../tools/EventSourcing')();

/**
 * Singleton instance
 */
let instance;

class EventStoreService {

    constructor() {
        this.functionMap = this.generateFunctionMap();
        this.subscriptions = [];
        this.aggregateEventsArray = this.generateAggregateEventsArray();
    }


    /**
     * Starts listening to the EventStore
     * Returns observable that resolves to each subscribe agregate/event
     *    emit value: { aggregateType, eventType, handlerName}
     */
    start$() {
        //default error handler
        const onErrorHandler = (error) => {
            console.error('Error handling  EventStore incoming event', error);
            process.exit(1);
        };
        //default onComplete handler
        const onCompleteHandler = () => {
            () => console.log('EventStore incoming event subscription completed');
        }

        return Rx.Observable.from(this.aggregateEventsArray)
            .map(aggregateEvent => { return { ...aggregateEvent, onErrorHandler, onCompleteHandler } })
            .map(params => this.subscribeEventHandler(params));
    }

    /**
     * Stops listening to the Event store
     * Returns observable that resolves to each unsubscribed subscription as string     
     */
    stop$() {
        return Rx.Observable.from(this.subscriptions)
            .map(subscription => {
                subscription.subscription.unsubscribe();
                return `Unsubscribed: aggregateType=${aggregateType}, eventType=${eventType}, handlerName=${handlerName}`;
            })
    }

    /**
     * Create a subscrition to the event store and returns the subscription info     
     * @param {{aggregateType, eventType, onErrorHandler, onCompleteHandler}} params
     * @return { aggregateType, eventType, handlerName  }
     */
    subscribeEventHandler({ aggregateType, eventType, onErrorHandler, onCompleteHandler }) {
        const handler = this.functionMap[eventType];

        const subscription =
            //MANDATORY:  AVOIDS ACK REGISTRY DUPLICATIONS
            eventSourcing.eventStore.ensureAcknowledgeRegistry$(aggregateType)
                .switchMap(() => eventSourcing.eventStore.getEventListener$(aggregateType, 'ms-devices-report_mbe_handler'))
                .filter(evt => evt.et === eventType)
                .mergeMap(evt => Rx.Observable.concat(
                    handler.fn.call(handler.obj, evt),
                    //MANDATORY:  ACKWOWLEDGE THIS EVENT WAS PROCESSED
                    eventSourcing.eventStore.acknowledgeEvent$(evt, 'ms-devices-report_mbe_handler'),
                ))
                .subscribe(
                    (evt) => console.log(`EventStoreService: ${eventType} process: ${evt}`),
                    onErrorHandler,
                    onCompleteHandler
                );
        this.subscriptions.push({ aggregateType, eventType, handlerName: handler.fn.name, subscription });
        return { aggregateType, eventType, handlerName: `${handler.obj.name}.${handler.fn.name}` };
    }

    /**
    * Starts listening to the EventStore
    * Returns observable that resolves to each subscribe agregate/event
    *    emit value: { aggregateType, eventType, handlerName}
    */
    syncState$() {
        return Rx.Observable.from(this.aggregateEventsArray)
            .filter(aggregate => aggregate.aggregateType !== 'Cronjob')// do not want to exec cronjob routines during sync
            .concatMap(params => this.subscribeEventRetrieval$(params))
    }


    /**
     * Create a subscrition to the event store and returns the subscription info     
     * @param {{aggregateType, eventType, onErrorHandler, onCompleteHandler}} params
     * @return { aggregateType, eventType, handlerName  }
     */
    subscribeEventRetrieval$({ aggregateType, eventType }) {
        const handler = this.functionMap[eventType];
        //MANDATORY:  AVOIDS ACK REGISTRY DUPLICATIONS
        return eventSourcing.eventStore.ensureAcknowledgeRegistry$(aggregateType)
            .switchMap(() => eventSourcing.eventStore.retrieveUnacknowledgedEvents$(aggregateType, 'ms-devices-report_mbe_handler'))
            .filter(evt => evt.et === eventType)
            .concatMap(evt => Rx.Observable.concat(
                handler.fn.call(handler.obj, evt),
                //MANDATORY:  ACKWOWLEDGE THIS EVENT WAS PROCESSED
                eventSourcing.eventStore.acknowledgeEvent$(evt, 'ms-devices-report_mbe_handler')
            ));
    }

    /**
     * Generates a map that assocs each Event with its handler
     */
    generateAggregateEventsArray() {
        return [
            { aggregateType: 'Device', eventType: 'DeviceGeneralInformationReported' },
            { aggregateType: 'Cronjob', eventType: 'EvalDisconnectedDevicesJobTriggered' },
        ];
    }

    /**
     * Generates a map that assocs each Event with its handler
     */
    generateFunctionMap() {
        return {
            'DeviceGeneralInformationReported': { fn: deviceGeneralInformation.handleDeviceGeneralInformationReportedEvent$, obj: deviceGeneralInformation },
            'EvalDisconnectedDevicesJobTriggered': { fn: evalDisconnectedDevicesJob.handleEvalDisconnectedDevicesJobTriggeredEvent$, obj: evalDisconnectedDevicesJob },
        };
    }

}



module.exports = () => {
    if (!instance) {
        instance = new EventStoreService();
        console.log('EventStoreService Singleton created');
    }
    return instance;
};