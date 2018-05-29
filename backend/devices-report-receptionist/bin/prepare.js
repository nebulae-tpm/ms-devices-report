'use strict'

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}

const Rx = require('rxjs');

const start = () => {
    Rx.Observable.concat(
        Rx.Observable.empty()
    ).subscribe(
        (evt) => console.log(evt),
        (error) => {
            console.error('Failed to prepare', error);
            process.exit(1);
        },
        () => {
            console.log('devices-report-recepcionist prepared');
            process.exit(0);
        }
    );
}

start();



