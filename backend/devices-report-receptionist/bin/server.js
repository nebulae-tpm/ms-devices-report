'use strict'

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}

const iotService = require('./services/iot/IotService')();
iotService.start();