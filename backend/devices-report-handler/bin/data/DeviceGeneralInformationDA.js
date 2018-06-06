'use strict'

const mongoDB = require('./MongoDB')();
const Rx = require('rxjs');
const ObjectTools = require('../tools/ObjectTools');
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
        const update = { $set: {} };
        if (aggregateVersion && aggregateVersionTimestamp) {
            update["$set"].aggregateVersion = aggregateVersion;
            update["$set"].aggregateVersionTimestamp = aggregateVersionTimestamp;
            update["$set"].aggregateUpdatedTimestamp = Date.now();

        }
        properties.forEach(prop => {
            if (ObjectTools.isObject(prop.value)) {
                Object.keys(prop.value).forEach(function (innerKey) {
                    if (prop.value[innerKey] !== undefined) {
                        update['$set'][`${prop.key}.${innerKey}`] = prop.value[innerKey];
                    }
                });
            } else {
                update['$set'][prop.key] = prop.value;
            }
        });

        return Rx.Observable.defer(() =>
            collection.updateOne(
                { sn },
                update,
                { upsert: true }
            ));
    }

    /**
     * extracts every device (id and lastConnectionTimestamp) that have not sent any kind of data 
     * for N minutes
     * @param {number} minutes 
     */
    static getConnectedDevicesThatHaventSentDataForMinutes$(minutes = 1) {
        return Rx.Observable.create(async observer => {

            const collection = mongoDB.db.collection(CollectionName);
            const threshold = (Date.now() - (minutes * 60000));
            const query = {
                connected: true,
                lastCommTimestamp: { '$lt': threshold }
            };
            const projection = { sn: 1, lastCommTimestamp: 1 };


            const cursor = collection.find(query, projection);
            let obj = await this.extractNextFromMongoCursor(cursor);
            while (obj) {
                observer.next(obj);
                obj = await this.extractNextFromMongoCursor(cursor);
            }

            observer.complete();
        });
    }


    /**
     * extracts every item in the mongo cursor, one by one
     * @param {*} cursor 
     */
    static extractAllFromMongoCursor$(cursor) {
        return Rx.Observable.create(async observer => {
            let obj = await DeviceGeneralInformationDA.extractNextFromMongoCursor(cursor);
            while (obj) {
                observer.next(obj);
                obj = await DeviceGeneralInformationDA.extractNextFromMongoCursor(cursor);
            }
            observer.complete();
        });
    }

    /**
     * Extracts the next value from a mongo cursos if available, returns undefined otherwise
     * @param {*} cursor 
     */
    static async extractNextFromMongoCursor(cursor) {
        const hasNext = await cursor.hasNext();
        if (hasNext) {
            const obj = await cursor.next();
            return obj;
        }
        return undefined;
    }

}

module.exports = DeviceGeneralInformationDA;