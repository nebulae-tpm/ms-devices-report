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
            if (Array.isArray(prop.value)) {
                update['$set'][prop.key] = prop.value;
            } else {
                Object.keys(prop.value).forEach(function (innerKey) {
                    if(prop.value[innerKey] !== undefined){
                        update['$set'][`${prop.key}.${innerKey}`] = prop.value[innerKey];
                    }                    
                });
            }

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