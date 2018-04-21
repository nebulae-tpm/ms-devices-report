// TEST LIBS
const assert = require('assert');
const Rx = require('rxjs');
const uuidv4 = require('uuid/v4');
const expect = require('chai').expect;


//LIBS FOR TESTING
const deviceGeneralInformation = require('../../bin/domain/DeviceGeneralInformation')();
const DeviceGeneralInformationFormatter = require('../../bin/domain/DeviceGeneralInformationFormatter');

//GLOABAL VARS to use between tests
let compressedReport =
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
            { "tp": "disconnect", "d": "unknown" }
        ],
        "v": 1
    }
    ;

let uncompressedReport =
    {
        "timestamp": 1523479439.711107,
        "version": 1,
        "reportVersion": 1,
        "state": {
            "timestamp": 1523479439.711107,
            "device": {
                "sn": "sn0001-0001-TEST",
                "type": "OMVZ7",
                "hostname": "OMVZ7"
            },
            "modem": {
                "cellid": 19692771,
                "band": "WCDMA",
                "mode": "WCDMA",
                "simStatus": "OK",
                "simImei": "359072061300642"
            },
            "display": {
                "sn": "sn0001-0001-DISP"
            },
            "network": {
                "interfaces": {
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
                "hostname": "OMVZ7",
                "mac": "00:01:02:03:04:05",
                "dns": [
                    "192.168.188.188"
                ],
                "gateway": "192.168.188.188"
            },
            "mainApp": {
                "appVers": {
                    "libgestionhardware": "15.05.22.01",
                    "libcontrolregistros": "17.10.31.1",
                    "embedded.libgestionhardware": "18.02.13.3",
                    "libcommonentities": "17.12.21.1",
                    "AppUsosTrasnporte": "18.02.07.1",
                    "libcontrolmensajeria": "17.10.31.1",
                    "libparamoperacioncliente": "17.10.27.1",
                    "libcontrolconsecutivos": "13.07.19.1"
                },
                "appTablesVers": {
                    "TablaTrayectos": "139",
                    "ListaNegra": "5378.07"
                }
            },
            "system": {
                "temperature": 35,
                "cpuStatus": [
                    8,
                    18,
                    21
                ],
                "upTime": "15:43:58 up 2 days, 8:39, load average: 0.08, 0.18, 0.21",
                "ram": {
                    "current": 456912,
                    "total": 1026448,
                    "type": "MEM",
                    "unit": "KiB"
                }
            },
            "volumes": [
                {
                    "current": 830,
                    "total": 7446,
                    "type": "SD",
                    "unit": "MiB"
                }
            ]
        },
        "events": [
            {
                "timestamp": 1523479712.827622,
                "type": "GPRMC",
                "value": "$GPRMC,,V,,,,,,,,,,N*53"
            },
            {
                "timestamp": 1523479571.524613,
                "type": "lowest_volt",
                "value": 11.95
            },
            {
                "timestamp": 1523479571.524613,
                "type": "highest_volt",
                "value": 11.95
            },
            {
                "timestamp": 1523554710.886797,
                "type": "alert_volt",
                "value": 0.29
            },
            {
                "type": "disconnect",
                "desc": "unknown"
            },
            {
                "timestamp": 1523479439.711107,
                "value": 0,
                "type": "usosTranspCount"
            },
            {
                "timestamp": 1523479439.711107,
                "type": "errsTranspCount",
                "value": 0
            }
        ]
    };

describe('BACKEND: devices-report-handler', function () {
    describe('Domain: DeviceGeneralInformationFormatter', function () {
        it('formatReport$', function (done) {
            DeviceGeneralInformationFormatter.formatReport$(compressedReport)
                .subscribe(
                    (formatted) => {
                        console.log(JSON.stringify(formatted, null, 2));
                        assert.deepEqual(JSON.parse(JSON.stringify(formatted)), uncompressedReport);
                    },
                    (error) => {
                        console.error('Failed formatting report', error);
                        return done(error);
                    },
                    () => { return done(); }
                );
        });
    });

});
