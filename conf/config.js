if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(['bunyan'],
function (bunyan) {
  var feederdb = {
      host: '10.181.15.218',
      port: '5984',
      db: {
        common: 'feeder',
        user: 'feeder_user',
        html: 'feeder_html'
      }
  }

  return {
    feederdb: {
      common: 'http://' + feederdb.host + ':' + feederdb.port + '/' + feederdb.db.common,
      user: 'http://' + feederdb.host + ':' + feederdb.port + '/' + feederdb.db.user,
      html: 'http://' + feederdb.host + ':' + feederdb.port + '/' + feederdb.db.html,
    },
    pagedb: "mongodb://localhost:27017/feeder_html",
    logger: function() {
      return bunyan.createLogger({ name: 'feeder_api' });
    }
  }
});
