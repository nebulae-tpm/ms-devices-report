// TEST LIBS
const assert = require('assert');
const should = require('chai').should;
const expect = require('chai').expect;
const Rx = require('rxjs');
const uuidv4 = require('uuid/v4');
const IoTServiceHelper = require('../../../bin/services/iot/IoTServiceHelper');
const shuffle = require('shuffle-array');

//LIBS FOR TESTING
let iotService;
let mqttBroker;

//GLOABAL VARS to use between tests
let unsortedBatches = [[], [], [], []];

/*
NOTES:
before run please start mqtt:
  docker run -it -p 1883:1883 -p 9001:9001 eclipse-mosquitto  
*/

describe('BACKEND: devices-report-recepcionist', function () {
    describe('Prepare Test', function () {
        it('Generate test events', function () {
            //four devices
            const deviceSns = [uuidv4(), uuidv4(), uuidv4(), uuidv4()];
            deviceSns.forEach(sn => {
                let batchIndex = -1;
                unsortedBatches.forEach(batch => {
                    batchIndex++;
                    for (let i = 0; i < 10; i++) {
                        const time = Date.now() + (batchIndex * 86400000) + (i * 60000);
                        const evt = {
                            "state": {
                                "i": i,
                                "sDv": sn,
                                "t": time,
                            },
                        };
                        batch.push(evt);                        
                    }
                });
            });
            unsortedBatches.forEach(batch => {
                shuffle(batch);                
                assert.equal(batch.length, 40);
                batch.forEach(evt => console.log(`SHUFFLE STREAM: ${JSON.stringify({ i: evt.state.i, sn: evt.state.sDv })}`));
            });
            assert.equal(unsortedBatches.length, 4);
        });

    });

    describe('IoTService: ensureOrderedStream', function () {
        it('ensureOrderedStream', function (done) {
            this.timeout(5000);
            const orderedData = [];
            const source = Rx.Observable.from(unsortedBatches)
                .concatMap(batch => Rx.Observable.of(batch).delay(1000))
                .mergeMap(batch => Rx.Observable.from(batch));
            IoTServiceHelper.ensureOrderedStream$(source)
                .subscribe(
                    (evt) => {
                        orderedData.push(evt);
                        console.log(`SORTED STREAM: ${JSON.stringify({ i: evt.state.i, sn: evt.state.sDv })}`);
                    },
                    (error) => {
                        return done(error)
                    },
                    () => {
                        assert.equal(orderedData.length, 120);
                        let currentDate = 0;
                        let currentDevSn = '';
                        orderedData.forEach(d => {
                            if (d.state.sDv !== currentDate) {
                                currentDate = 0;
                                currentDevSn = d.state.sDv;
                            }
                            expect(d.state.t).to.be.greaterThan(currentDate);
                            currentDate = d.state.t;
                        })
                        return done();
                    }
                );
        });

    });


});
