'use strict'

const mongoDB = require('./MongoDB')();
const Rx = require('rxjs');
const CollectionName = "DeviceGeneralInformation";

class DeviceGeneralInformationDA {


    /**
     * gets DeviceGeneralInformation by device serial number
     * @param {string} type 
     */
    static getDeviceGeneralInformation$(sn) {
        const collection = mongoDB.db.collection(CollectionName);
        return Rx.Observable.defer(() => collection.findOne({ sn }));
    }

    /**
     * 
     * Updates a device general informtion
     * @param {String} sn Device serial number
     * @param {[{key, value}]} properties Array of properties to update
     * @param {number} aggregateVersion new aggregate version
     * @param {number} aggregateVersionTimestamp new aggregate version timestamp
     */
    static updateDeviceGenearlInformation$(sn, properties, aggregateVersion, aggregateVersionTimestamp) {
        const collection = mongoDB.db.collection(CollectionName);
        const update = {
            $set: {
                aggregateVersion,
                aggregateVersionTimestamp,
                aggregateUpdatedTimestamp: Date.now()
            }
        };
        properties.forEach(prop => {
            update['$set'][prop.key] = prop.value;
        });

        return Rx.Observable.defer(() =>
            collection.updateOne(
                { sn },
                update,
                { upsert: true }
            ));
    }

}

module.exports = DeviceGeneralInformationDA;