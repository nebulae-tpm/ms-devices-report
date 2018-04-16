// TEST LIBS
const assert = require('assert');
const Rx = require('rxjs');
const uuidv4 = require('uuid/v4');

//LIBS FOR TESTING
const deviceGeneralInformation = require('../../bin/domain/DeviceGeneralInformation')();

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
            /*
            {"timeStamp": 1523479712.827622, "value": "$GPRMC,,V,,,,,,,,,,N*53", "type": "GPRMC"},
            {"t": 1523479712.827622, "vl": "$GPRMC,,V,,,,,,,,,,N*53", "tp": "GPRMC"},

            {"timeStamp": 1523479571.524613, "value": 11.95, "type": "lowest_volt"},
            {"t": 1523479571.524613, "vl": 11.95, "tp": "lowest_volt"},

            {"vl":0.28999999999999998,"t":1523554710.886797,"tp":"alert_volt"},
            */
        ],
        "v": 1
    }
    ;


/*
NOTES:
before run please start mqtt:
  docker run -it -p 1883:1883 -p 9001:9001 eclipse-mosquitto  
*/

describe('Domain: DeviceGeneralInformation', function () {
    describe('handle DeviceGeneralInformationReported', function () {
        it('Format original CMD', function (done) {
            deviceGeneralInformation.formatReport$(JSON.stringify(report))
            .subscribe(
                (formatted) => console.log(JSON.stringify(formatted)),
                (error) => {
                    console.error('Failed formatting report',error);
                    return done(error);
                },
                () => {return done();}
            );
        });
    });

});
