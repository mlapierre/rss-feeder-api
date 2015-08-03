var requirejs = require('requirejs');

requirejs.config({
    //Pass the top-level main.js/index.js require
    //function to requirejs so that node modules
    //are loaded relative to the top-level JS file.
    nodeRequire: require,
    baseUrl: 'lib'
});

requirejs(['request', 'FeederStore', 'FeederCrawler', 'node-schedule', 'bunyan'],
function   (request, FeederStore, FeederCrawler, schedule, bunyan) {
  var feederStore = new FeederStore(),
      feederCrawler = new FeederCrawler(),
      log = bunyan.createLogger({ name: 'feeder_api'});

  //fetchAndSave('http://www.theregister.co.uk/headlines.atom');
  // fetchAndSave('http://www.polygon.com/rss/index.xml');
  // fetchAndSave('http://feeds.arstechnica.com/arstechnica/index');
  // fetchAndSave('http://feeds.gawker.com/lifehacker/full');

  log.info('Starting Feed Fetch Scheduler');
  var j = schedule.scheduleJob({minute: 21}, function(){
    updateAll();
  });

  function updateAll() {
    log.info('Starting Feed Update');
    feederStore.getAllFeeds()
      .then(function(feeds) {
        feeds.map(function(feed) {
          fetchAndSave(feed.feed_link);
        });
      }).catch(function(err) {
        log.error(err);
      }).done();
    };

  function fetchAndSave(feed_link) {
    log.info('Fetching: ' + feed_link);
    feederCrawler
      .getFeed(feed_link)
      .then(function(feed) {
        feederStore.save(feed);
      }).catch(function(err) {
        log.error(err);
      }).done();
  };
});