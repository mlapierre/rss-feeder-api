var requirejs = require('requirejs');

requirejs.config({
    //Pass the top-level main.js/index.js require
    //function to requirejs so that node modules
    //are loaded relative to the top-level JS file.
    nodeRequire: require,
    baseUrl: 'lib'
});

requirejs(['express', 'bunyan', 'Feed', 'Tag', 'body-parser', 'cors', 'morgan'],
function   (express, bunyan, Feed, Tag, bodyparser, cors, logger) {
  var app = express(),
      log = bunyan.createLogger({ name: 'feeder_api'});

  log.level("debug");

  // server.on('after', restify.auditLogger({
  //   log: bunyan.createLogger({
  //     name: 'audit',
  //     stream: process.stdout
  //   })
  // }));
  app.use(cors());
  app.use(bodyparser.json());
  app.use(logger());

  app.post('/feeds/add', addFeed);
  //server.get('/feeds/:name/articles', getArticles);

  var server = app.listen(3000, function() {
    log.info('Server listening at http://%s:%s', server.address().address, server.address().port);
  });

  function addFeed(req, res, next) {
    Feed.add(req.body.link)
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
    Feed.getArticles(req.body.name)
      .then(function(result) {
        res.send(result);
        next();
      }).catch(function(err) {
        log.error(err);
      }).done();
  };

});

