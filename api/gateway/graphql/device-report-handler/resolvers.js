const withFilter = require('graphql-subscriptions').withFilter;
const PubSub = require('graphql-subscriptions').PubSub;
const Rx = require('rxjs');
const broker = require('../../broker/BrokerFactory')();

let pubsub = new PubSub();
module.exports = {
  Query: {
    getDeviceAlarmThresholds (root, args, context) {
      return context.broker
        .forwardAndGetReply$(
          'DeviceReportHandler',
          'gateway.graphql.query.getDeviceAlarmThresholds',
          { root, args, jwt: context.encodedToken },
          500
        )
        .toPromise();
    }
  },
};