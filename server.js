var requirejs = require('requirejs');

requirejs.config({
    //Pass the top-level main.js/index.js require
    //function to requirejs so that node modules
    //are loaded relative to the top-level JS file.
    nodeRequire: require,
    baseUrl: 'lib'
});

requirejs(['restify', 'bunyan', 'Feed', 'Tag'],
function   (restify, bunyan, Feed, Tag) {
  var server = restify.createServer(),
      log = bunyan.createLogger({ name: 'feeder_api'});

  log.level("debug");

  server.use(restify.CORS());
  server.use(restify.bodyParser({ mapParams: true }));

  server.on('after', restify.auditLogger({
    log: bunyan.createLogger({
      name: 'audit',
      stream: process.stdout
    })
  }));

  server.post('/feeds/add', addFeed);
  server.get('/feeds/:name/articles', getArticles);

  server.listen(3000, function() {
    log.info('%s listening at %s', server.name, server.url);
  });

  function addFeed(req, res, next) {
    Feed.add(req.params.link)
      .then(function(result) {
        // Add to 'untagged' tag
        //log.debug(result);
        console.log(result);
        Tag.tag(result.feed, 'untagged')
          .catch(function(err) {
            log.error(err);
          });
        res.send(result);
        next();
      }).catch(function(err) {
        log.error(err);
      }).done();
  };

  function getArticles(req, res, next) {
    Feed.getArticles(req.params.name)
      .then(function(result) {
        res.send(result);
        next();
      }).catch(function(err) {
        log.error(err);
      }).done();
  };

});

