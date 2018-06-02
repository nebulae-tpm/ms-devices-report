// TEST LIBS
const assert = require('assert');
const should = require('chai').should;
const expect = require('chai').expect;
const Rx = require('rxjs');
const uuidv4 = require('uuid/v4');

//LIBS FOR TESTING
let eventSourcing;
let deviceGeneralInformation;

//GLOABAL VARS to use between tests
let report =
    {
        "state": {
            "uTC": 0,
            "sDv": "sn0001-0001-TEST",
            "sDs": "sn0001-0001-DISP",
            "ATVer": {
                "LN": "5378.07",
                "TT": "139"
            },
            "gs": {
                "band": "WCDMA",
                "mode": "WCDMA",
                "temp": 35,
                "cellid": 19692771
            },
            "g": "192.168.188.188",
            "sS": "OK",
            "h": "OMVZ7",
            "dD": [
                {
                    "tV": 1026448,
                    "uI": "KiB",
                    "cV": 456912,
                    "tp": "MEM"
                },
                {
                    "tV": 7446,
                    "uI": "MiB",
                    "cV": 830,
                    "tp": "SD"
                }
            ],
            "iMM": {
                "lo": [
                    "127.0.0.1/8",
                    "::1/128"
                ],
                "eth1": [
                    "172.28.99.216/28",
                    "fe80::d82a:bdff:fe31:e408/64"
                ],
                "eth0": [
                    "192.168.188.197/24",
                    "fe80::201:2ff:fe03:405/64"
                ]
            },
            "m": "00:01:02:03:04:05",
            "uT": "15:43:58 up 2 days, 8:39, load average: 0.08, 0.18, 0.21",
            "eTC": 0,
            "sI": "359072061300642",
            "t": 1523479439.711107,
            "dns": [
                "192.168.188.188"
            ],
            "v": {
                "lV": 11.824,
                "hV": 12.256,
                "cV": 12.096
            },
            "AVer": {
                "lGH": "15.05.22.01",
                "lCR": "17.10.31.1",
                "elGH": "18.02.13.3",
                "lCE": "17.12.21.1",
                "aUT": "18.02.07.1",
                "lCM": "17.10.31.1",
                "lPOC": "17.10.27.1",
                "lCC": "13.07.19.1"
            },
            "tDv": "OMVZ7",
            "cS": [
                8.0,
                18.0,
                21.0
            ]
        },
        "events": [
            { "t": 1523479712.827622, "vl": "$GPRMC,,V,,,,,,,,,,N*53", "tp": "GPRMC" },
            { "t": 1523479571.524613, "vl": 11.95, "tp": "lowest_volt" },
            { "t": 1523479571.524613, "vl": 11.95, "tp": "highest_volt" },
            { "t": 1523554710.886797, "vl": 0.28999999999999998, "tp": "alert_volt" },
        ],
        "v": 1
    }
    ;


/*
NOTES:
before run please start mqtt:
  docker run -it -p 1883:1883 -p 9001:9001 eclipse-mosquitto  
*/

describe('BACKEND: devices-report-handler', function () {
    describe('Prepare Test', function () {
        it('Set Environment variable', function (done) {
            // Event sourcing config
            process.env.EVENT_STORE_BROKER_TYPE = 'MQTT'
            process.env.EVENT_STORE_BROKER_EVENTS_TOPIC = 'Events'
            process.env.EVENT_STORE_BROKER_URL = 'mqtt://localhost:1883'
            process.env.EVENT_STORE_STORE_TYPE = 'MONGO'
            process.env.EVENT_STORE_STORE_URL = 'mongodb://localhost:27017'
            process.env.EVENT_STORE_STORE_AGGREGATES_DB_NAME = 'Aggregates'
            process.env.EVENT_STORE_STORE_EVENTSTORE_DB_NAME = 'EventStore'
            // IoT incoming broker config
            process.env.IOT_BROKER_TYPE = 'MQTT'
            process.env.IOT_BROKER_TOPIC = 'IoT'
            process.env.IOT_BROKER_URL = 'mqtt://localhost:1883'
            return done();
        });
        it('Start EventStore', function (done) {
            eventSourcing = require('../../bin/tools/EventSourcing')();
            eventSourcing.eventStore.start$()
                .subscribe(
                    (evt) => console.log(`Start EventStore: ${evt}`),
                    (error) => {
                        console.error('Error Starting EventStore', error);
                        return done(error);
                    },
                    () => {
                        console.log('EventStore Started');
                        return done();
                    }
                );
        });
        it('Start DeviceGeneralInformation', function (done) {
            deviceGeneralInformation = require('../../bin/domain/DeviceGeneralInformation')();
            return done();
        });

    });
    describe('Domain: DeviceGeneralInformation', function () {
        it('handleReportDeviceGeneralInformation', function (done) {
            deviceGeneralInformation.handleReportDeviceGeneralInformation$(report)
                .subscribe(
                    ({ storeResult, brokerResult }) => {
                        // console.log(
                        //     `IotService proccesed incoming mesage;\n
                        //     storeResult: ${JSON.stringify(storeResult)}\n
                        //     brokerResult: ${JSON.stringify(brokerResult)}\n
                        // `);
                        expect(storeResult).to.not.be.undefined;
                        expect(brokerResult).to.not.be.undefined
                        expect(brokerResult.messageId).to.not.be.undefined
                    },
                    (error) => {
                        console.error(`handleReportDeviceGeneralInformation failed to process incoming msg`, error);
                        return done(error);
                    },
                    () => {
                        return done();
                    }
                );
        });
    });
    describe('Tear down Test', function () {
        it('Stop Event Store', function (done) {
            eventSourcing.eventStore.stop$()
                .subscribe(
                    (evt) => console.log(`Stop EventStore: ${evt}`),
                    (error) => {
                        console.error('Error Stoping EventStore', error);
                        return done(error);
                    },
                    () => {
                        console.log('EventStore Stopped');
                        return done();
                    }
                );
        });
    });

});
