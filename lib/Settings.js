if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(['bunyan'],
function (bunyan) {
  return {
    host: 'http://localhost:5984/',
    commondb : 'feeder',
    userdb: 'feeder_user',
    logger: function() {
      return bunyan.createLogger({ name: 'feeder_api' });
    }
  }
});
