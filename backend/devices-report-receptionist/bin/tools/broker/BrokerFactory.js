'use strict'

class BrokerFactory {
    /**
     * Factory instance and config
     */
    constructor(type) {
        switch (type) {
            case 'PUBSUB':
                const PubSubBroker = require('./PubSubBroker');
                this.broker = new PubSubBroker({
                    topic: process.env.IOT_BROKER_TOPIC,
                    topicSubscription: `${process.env.IOT_BROKER_TOPIC}_devices-report-recepcionist`
                });
                break;
            case 'MQTT':
                const MqttBroker = require('./MqttBroker');
                this.broker = new MqttBroker({
                    url: process.env.IOT_BROKER_URL,
                    topic: process.env.IOT_BROKER_TOPIC
                });
                break;
            default:
                throw new Error(`invalid Broker type @BrokerFactory: ${type}`);
        }
    }
    /**
     * Get the broker instance
     */
    getBroker() {
        return this.broker
    }
}

module.exports = BrokerFactory;