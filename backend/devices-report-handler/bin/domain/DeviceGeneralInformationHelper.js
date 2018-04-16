const Rx = require('rxjs');

class DeviceGeneralInformation {

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
                timeStamp: state.t,
                device: {
                    temperature: state.gs.temp,
                    sn: state.sDv,
                    type: state.tDv
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
                    volt: state.vo,
                    cpuStatus: state.cS,
                    upTime: state.uT,
                }
            }
        };

        if (formatted.state.mainApp.appVers) {
            const app = formatted.state.mainApp.appVers;
            app.libgestionhardware = app.lGH;
            app.lGH = undefined;
            app.libcontrolregistros = app.lCR;
            app.lCR = undefined;
            app['embedded.libgestionhardware'] = app.elGH;
            app.elGH = undefined;
            app.libcommonentities = app.lCE;
            app.lCE = undefined;
            app.AppUsosTrasnporte = app.aUT;
            app.aUT = undefined;
            app.libcontrolmensajeria = app.lCM;
            app.lCM = undefined;
            app.libparamoperacioncliente = app.lPOC;
            app.lPOC = undefined;
            app.libcontrolconsecutivos = app.lCC;
            app.lCC = undefined;

        }

        if (formatted.state.mainApp.appTablesVers) {
            const table = formatted.state.mainApp.appTablesVers;
            table.TablaTrayectos = table.TT;
            table.TT = undefined;
            table.ListaNegra = table.LN;
            table.LN = undefined;

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
                formatted.state.volumes.push(volume);
            });
        }
        return formatted;
    }



}

module.exports = DeviceGeneralInformation;