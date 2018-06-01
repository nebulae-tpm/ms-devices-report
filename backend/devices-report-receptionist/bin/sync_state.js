'use strict'

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}


const Rx = require('rxjs');

const start = () => {
    Rx.Observable.concat(
        Rx.Observable.of('nothing to sync at the moment')
    ).subscribe(
        (evt) => console.log(`EventStoreService (syncing): ${(evt instanceof Object) ? JSON.stringify(evt) : evt}`),
        (error) => {
            console.error('Failed to sync state', error);
            process.exit(1);
        },
        () => {
            console.log('devices-report-recepcionist state synced');
            process.exit(0);
        }
    );
}

start();



