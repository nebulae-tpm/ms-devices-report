'use strict';

const broker = require('../../tools/broker/BrokerFactory')();
const Rx = require('rxjs');
const jsonwebtoken = require('jsonwebtoken');
const DeviceStatefulEventsGenerator = require('../../domain/DeviceStatefulEventsGenerator');
const jwtPublicKey = process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n');

let instance;

class GraphQlService {
  constructor() {
    this.functionMap = this.generateFunctionMap();
  }

  generateFunctionMap() {
    return {
      'gateway.graphql.query.getDeviceAlarmThresholds': DeviceStatefulEventsGenerator.getAlarmThresholds$
    };
  }

  start$() {
    return Rx.Observable.create(observer => {
      this.subscription = broker
        .getMessageListener$(['DeviceReportHandler'], Object.keys(this.functionMap))
        //decode and verify the jwt token
        .map(message => {
          return {
            authToken: jsonwebtoken.verify(message.data.jwt, jwtPublicKey),
            message
          };
        })
        //ROUTE MESSAGE TO RESOLVER
        .mergeMap(({ authToken, message }) => { 
          return this.functionMap[message.type](message.data, authToken).map(
            response => {
              return {
                response,
                correlationId: message.id,
                replyTo: message.attributes.replyTo
              };
            }
          )
        }          
        )
        .mergeMap(({ response, correlationId, replyTo }) => {
          if (replyTo) {
            return broker.send$(
              replyTo,
              'gateway.graphql.Query.response',
              response,
              { correlationId }
            );
          } else {
            return Rx.Observable.of(undefined);
          }
        })
        //send response back if neccesary
        .subscribe(val => {
            // broker.send$('MaterializedViewUpdates','gateway.graphql.Subscription.response',response);
            // console.log('Query response => ', val);
          },
          error => console.error('Error listening to messages', error),
          () => {
            console.log(`Message listener stopped`);
          }
        );
      observer.next('GraphQlService is listening to Device topic');
      observer.complete();
    });
  }

  stop() {}
}

module.exports = () => {
  if (!instance) {
    instance = new GraphQlService();
    console.log('NEW instance GraphQlService !!');
  }
  return instance;
};
