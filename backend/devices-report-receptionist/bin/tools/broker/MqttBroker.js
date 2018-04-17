'use strict'

const MQTT = require("async-mqtt");
const Rx = require('rxjs');
const uuidv4 = require('uuid/v4');

class MqttBroker {

    constructor({ url }) {
        this.url = url;        
        this.senderId = uuidv4();
        /**
         * Rx Subject for incoming messages
         */
        this.incomingMessages$ = new Rx.BehaviorSubject();
        this.listeningTopics = [];
        /**
         * MQTT Client
         */
        this.mqttClient = MQTT.connect(this.url);
        this.mqttClient.on('connect', () => console.log(`Mqtt client connected`));
        this.mqttClient.on('message', (topicName, message) => {
            const envelope = JSON.parse(message);
            // message is Buffer
            this.incomingMessages$.next(
                {
                    id: envelope.id,
                    data: envelope.data,
                    topic: topicName
                }
            );
        });
    }


    /**
     * Returns an Observable that will emit any message
     * @param {string[] ?} topics topic to listen
     * @param {boolean ?} ignoreSelfEvents 
     */
    getMessageListener$(topics = [], ignoreSelfEvents = true) {
        return this.configMessageListener$(topics)
            .switchMap(() =>
                this.incomingMessages$
                    .filter(msg => msg)
                    .filter(msg => !ignoreSelfEvents || msg.attributes.senderId !== this.senderId)
                    .filter(msg => topics.length === 0 || topics.indexOf(msg.topic) > -1)                    
            );
    }



    /**
     * Config the broker to listen to several topics
     * Returns an observable that resolves to a stream of subscribed topics
     * @param {Array} topics topics to listen
     */
    configMessageListener$(topics) {
        return Rx.Observable.from(topics)
            .filter(topic => this.listeningTopics.indexOf(topic) === -1)
            .mergeMap(topic =>
                Rx.Observable.fromPromise(this.mqttClient.subscribe(topic))
                    .map(() => {
                        this.listeningTopics.push(topic);
                        return topic;
                    })
            ).reduce((acc, topic) => {
                acc.push(topic);
                return acc;
            }, []);
    }

    /**
     * Disconnect the broker and return an observable that completes when disconnected
     */
    disconnectBroker$() {
        return Rx.Observable.fromPromise(this.mqttClient.end());
    }
}

module.exports = MqttBroker;