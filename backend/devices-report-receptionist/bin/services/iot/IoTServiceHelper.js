const Rx = require('rxjs');

class IoTServiceHelper {

    /**
     * Recieves a source Observable of data, diverge the stream grouped by device serial number, 
     * sort each resulting stream and returns a the new observable
     * @param {Rx.Observable} observable 
     */
    static ensureOrderedStream$(observable) {
        return observable.groupBy(data => data.state.sDv)
            .mergeMap(deviceStream =>
                deviceStream.buffer(deviceStream.throttleTime(1000))
                    .filter(bufferedArray => bufferedArray && bufferedArray.length > 0)
                    .map(bufferedArray => bufferedArray.sort((data1, data2) => { return data1.state.t - data2.state.t }))
                    .mergeMap(bufferedArray => Rx.Observable.from(bufferedArray))
            );
    }
}

module.exports = IoTServiceHelper;