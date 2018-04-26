const Rx = require('rxjs');

class DeviceGeneralInformationFormatter {


    /**
     * Decompress DeviceGeneralInformation report and format it to the standard format
     * @param {Object} compressedReport 
     */
    static formatReport$(compressedReport) {
        return Rx.Observable.of(compressedReport)
            .map(unformatted => this.formatIncomingReport(unformatted))
    }

    /**
     * Process incoming compressed report from a device and formats to the standard format
     * @param {*} incomingReport 
     */
    static formatIncomingReport(incomingReport) {
        switch (incomingReport.v) {
            case 1:
                return this.formatIncomingReportV1(incomingReport);
                break;
            default:
                throw new Error('Incoming Device General Information has an unsupported version: ' + incomingReport.v);
                break
        }
    }

    /**
     * Process incoming compressed report (with version:1) from a device and formats to the standard format
     * @param {*} report 
     */
    static formatIncomingReportV1(report) {

        const state = report.state;
        const events = report.events;
        const reportVersion = report.v;

        const formatted = {
            timestamp: state.t,
            version: 1,
            reportVersion,

            state: {
                timestamp: state.t,
                device: {
                    sn: state.sDv,
                    type: state.tDv,
                    hostname: state.h
                },
                modem: {
                    cellid: state.gs.cellid,
                    band: state.gs.band,
                    mode: state.gs.mode,
                    sn: state.sM,
                    simStatus: state.sS,
                    simImei: state.sI,
                    rsrq: state.gs.rsrq,
                    sinr: state.gs.sinr,
                    tac: state.gs.tac,
                },
                display: {
                    sn: state.sDs,
                },
                network: {
                    interfaces: state.iMM,
                    hostname: state.h,
                    mac: state.m,
                    dns: state.dns,
                    gateway: state.g,
                },
                mainApp: {
                    appVers: state.AVer,
                    appTablesVers: state.ATVer,
                    usosTranspCount: state.uTC,
                    errsTranspCount: state.eTC,
                },
                system: {
                    temperature: state.gs.temp,
                    voltage: state.vo,
                    cpuStatus: state.cS,
                    upTime: state.uT,
                }
            }
        };

        if (formatted.state.mainApp.appVers) {
            const app = formatted.state.mainApp.appVers;
            app.libgestionhardware = app.lGH;
            delete app.lGH;
            app.libcontrolregistros = app.lCR;
            delete app.lCR;
            app['embedded.libgestionhardware'] = app.elGH;
            delete app.elGH;
            app.libcommonentities = app.lCE;
            delete app.lCE;
            app.AppUsosTrasnporte = app.aUT;
            delete app.aUT;
            app.libcontrolmensajeria = app.lCM;
            delete app.lCM;
            app.libparamoperacioncliente = app.lPOC;
            delete app.lPOC;
            app.libcontrolconsecutivos = app.lCC;
            delete app.lCC;

        }

        if (formatted.state.mainApp.appTablesVers) {
            const table = formatted.state.mainApp.appTablesVers;
            table.TablaTrayectos = table.TT;
            delete table.TT;
            table.ListaNegra = table.LN;
            delete table.LN;
        }

        if (formatted.state.system.voltage) {
            formatted.state.system.voltage.low = formatted.state.system.voltage.lV;
            formatted.state.system.voltage.high = formatted.state.system.voltage.hV;
            formatted.state.system.voltage.current = formatted.state.system.voltage.cV;
            delete formatted.state.system.voltage.lV;
            delete formatted.state.system.voltage.hV;
            delete formatted.state.system.voltage.cV;
        }

        if (state.dD) {
            formatted.state.volumes = [];
            state.dD.forEach(vol => {
                const volume = {
                    current: vol.cV,
                    total: vol.tV,
                    type: vol.tp,
                    unit: vol.uI,
                };
                if (volume.type === 'MEM') {
                    formatted.state.system.ram = volume;
                } else {
                    formatted.state.volumes.push(volume);
                }
            });
        }
        if (report.events) {
            formatted.events = [];
            report.events.forEach(evt => {
                formatted.events.push(
                    {
                        timestamp: evt.t,
                        type: evt.tp,
                        value: evt.vl,
                        desc: evt.d
                    }
                );
            });
        }


        // at the present time this event is sent within the state.mainApp
        // so we need to get the value, remove ir from the state.mainApp and create a event instead

        if (formatted.state.mainApp.usosTranspCount !== undefined) {
            if (!formatted.events) {
                formatted.events = [];
            }
            formatted.events.push({
                timestamp: formatted.state.timestamp,
                value: formatted.state.mainApp.usosTranspCount,
                type: 'usosTranspCount'
            });
            delete formatted.state.mainApp.usosTranspCount;

        }
        // at the present time this event is sent within the state.mainApp
        // so we need to get the value, remove ir from the state.mainApp and create a event instead
        if (formatted.state.mainApp.errsTranspCount !== undefined) {
            if (!formatted.events) {
                formatted.events = [];
            }
            formatted.events.push({
                timestamp: formatted.state.timestamp,
                type: 'errsTranspCount',
                value: formatted.state.mainApp.errsTranspCount
            });
            delete formatted.state.mainApp.errsTranspCount;
        }

        if (state.aD) {
            if (state.aD.gN && formatted.state.device) {
                formatted.state.device.groupName = state.aD.gN;
            }
        }

        return formatted;
    }



}

module.exports = DeviceGeneralInformationFormatter;