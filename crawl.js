var requirejs = require('requirejs');

requirejs.config({
    //Pass the top-level main.js/index.js require
    //function to requirejs so that node modules
    //are loaded relative to the top-level JS file.
    nodeRequire: require,
    baseUrl: 'lib'
});

requirejs(['request', 'bunyan', 'FeederStore', 'FeederCrawler'],
function   (request, bunyan, FeederStore, FeederCrawler) {

  //var feed_url = 'http://feeds.arstechnica.com/arstechnica/index';
  //var feed_url = "http://www.polygon.com/rss/index.xml";
  //var feed_url = "http://feeds.gawker.com/lifehacker/full";

  var feederStore = new FeederStore('http://localhost:5984/feeder'),
      feederCrawler = new FeederCrawler(),
      log = bunyan.createLogger({ name: 'feeder_api'});

  feederCrawler.setLogger(log);

  updateAll();

  function updateAll() {
    feederStore.getAllFeeds()
      .then(function(feeds) {
        feeds.map(function(feed) {
          console.log(feed.feed_link);
          fetchAndSave(feed.feed_link);
        });
      }).catch(function(err) {
        console.log(err);
      }).done();
    };

  function fetchAndSave(feed_link) {
    feederCrawler
      .fetch(feed_link)
      .then(function(feed) {
        feederStore.save(feed);
      }).catch(function(err) {
        console.log(err);
      }).done();
  };
});