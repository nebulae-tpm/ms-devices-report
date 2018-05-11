'use strict'

const Rx = require('rxjs');
const uuidv4 = require('uuid/v4');

class PubSubBroker {

    constructor({ }) {
        /**
         * Rx Subject for every message reply
         */
        this.incomingMessages$ = new Rx.BehaviorSubject();
        /**
         * Map of verified topics
         */
        this.verifiedTopics = {};

        const PubSub = require('@google-cloud/pubsub');
        this.pubsubClient = new PubSub({
            //projectId: this.projectId,
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
                    .filter(msg => topics.length === 0 || topics.indexOf(msg.topic) > -1)
            );
    }

    /**
     * Config the broker to listen to several topics
     * Returns an observable that resolves to a stream of subscribed topics
     * @param {Array} topics topics to listen
     */
    configMessageListener$(topics) {
        return Rx.Observable.create((observer) => {


            Rx.Observable.from(topics)
                .mergeMap(topic => this.getSubscription$(topic, `${topic}_devices-report-recepcionist`)
                    .map(subsription => { return { topic, subsription } }))
                .subscribe(
                    ({ topic, subsription }) => {
                        subsription.on(`message`, message => {
                            //console.log(`Received message ${message.id}:`);
                            message.ack();
                            this.incomingMessages$.next(
                                {
                                    id: message.id,
                                    data: JSON.parse(message.data),
                                    attributes: message.attributes,
                                    correlationId: message.attributes.correlationId,
                                    topic: topic
                                }
                            );                            
                        });
                        observer.next(topic);
                    },
                    (err) => {
                        console.error('Failed to obtain GatewayReplies subscription', err);
                        observer.error(err);
                    },
                    () => {
                        console.log('PubSubBroker listener registered');
                        observer.complete();
                    }

                )
        })
            .reduce((acc, topic) => {
                acc.push(topic);
                return acc;
            }, []);

        ;

    }

    /**
     * Gets an observable that resolves to the topic object
     * @param {string} topicName 
     */
    getTopic$(topicName) {
        //Tries to get a cached topic
        const cachedTopic = this.verifiedTopics[topicName];
        if (!cachedTopic) {
            //if not cached, then tries to know if the topic exists
            const topic = this.pubsubClient.topic(topicName);
            return Rx.Observable.fromPromise(topic.exists())
                .map(data => data[0])
                .switchMap(exists => {
                    if (exists) {
                        //if it does exists, then store it on the cache and return it
                        this.verifiedTopics[topicName] = topic;
                        console.log(`Topic ${topicName} already existed and has been set into the cache`);
                        return Rx.Observable.of(topic);
                    } else {
                        //if it does NOT exists, then create it, store it in the cache and return it
                        return this.createTopic$(topicName);
                    }
                })
                ;
        }
        //return cached topic
        return Rx.Observable.of(cachedTopic);
    }

    /**
     * Creates a Topic and return an observable that resolves to the created topic
     * @param {string} topicName 
     */
    createTopic$(topicName) {
        return Rx.Observable.fromPromise(this.pubsubClient.createTopic(topicName))
            .switchMap(data => {
                this.verifiedTopics[topicName] = this.pubsubClient.topic(topicName);
                console.log(`Topic ${topicName} have been created and set into the cache`);
                return Rx.Observable.of(this.verifiedTopics[topicName]);
            });
    }

    /**
     * Returns an Observable that resolves to the subscription
     * @param {string} topicName 
     * @param {string} subscriptionName 
     */
    getSubscription$(topicName, subscriptionName) {
        return this.getTopic$(topicName)
            .switchMap(topic => Rx.Observable.fromPromise(
                topic.subscription(subscriptionName)
                    .get({ autoCreate: true }))
            ).map(results => results[0]);
    }



    /**
     * Stops broker 
     */
    disconnectBroker$() {

        return Rx.Observable.create((observer) => {
            this.getSubscription$(this.topic, this.topicSubscription).subscribe(
                (subscription) => {
                    subscription.removeListener(`message`);
                    observer.next(`Removed listener for ${subscription}`);
                },
                (error) => {
                    console.error(`Error disconnecting Broker`, error);
                    observer.error(error);
                },
                () => {
                    console.log('Broker disconnected');
                    observer.complete();
                }
            );
        });

    }
}

module.exports = PubSubBroker;