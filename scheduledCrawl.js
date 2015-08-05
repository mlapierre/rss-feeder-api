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

  log.level("debug");

  log.info('Starting Web Crawl Scheduler');
  var j = schedule.scheduleJob('21 4,9 * * *', function(){
    updateAll();
  });

  function updateAll() {
    log.info('Starting Web Crawl');
    feederStore.getAllArticles()
      .then(function(articles) {
        articles.forEach(function(article) {
          if (!article.crawled) {
            fetchAndSave(article);
          }
        });
      }).catch(function(err) {
        log.error(err);
      }).done();
    };

  function fetchAndSave(article) {
    var link = article.link;
    if (article.origlink) {
      link = article.origlink;
    }
    if (!link) {
      log.error("No link found for article: " + article._id);
      return;
    }

    log.debug('Fetching: ' + link);
    feederCrawler.get(link).then(function(response) {
      if (response.statusCode == 200) {
        return feederStore.saveArticleHTML(link, response.body).then(function(result) {
          if (result.status === 'success') {
            log.info('Saved ' + link);
            //log.debug(result.html);
          }
        });
      } else {
        log.error("Invalid response: " + response.statusCode + " for URI: " + link);
      }
    }).catch(function(err) {
      log.error(err);
    }).done();
  };
});