var requirejs = require('requirejs');

requirejs.config({
    //Pass the top-level main.js/index.js require
    //function to requirejs so that node modules
    //are loaded relative to the top-level JS file.
    nodeRequire: require
});

requirejs(['restify', 'bunyan', 'feed', 'tag'],
function   (restify, bunyan, feed, tag) {
  var server = restify.createServer()
    , log = bunyan.createLogger({ name: 'feeder_api'});
  log.level("debug")
  feed.setLogger(log);
  tag.setLogger(log);

  server.use(restify.CORS());
  server.use(restify.bodyParser({ mapParams: true }));

  server.on('after', restify.auditLogger({
    log: bunyan.createLogger({
      name: 'audit',
      stream: process.stdout
    })
  }));

  server.post('/feeds/add', addFeed);

  server.listen(3000, function() {
    log.info('%s listening at %s', server.name, server.url);
  });

  function addFeed(req, res, next) {
    feed.add(req.params.link, function(result) {
      // Add to 'untagged' tag
      tag.tag(result.feed, 'untagged');
      res.send(result);
      next();
    });
  }
});

