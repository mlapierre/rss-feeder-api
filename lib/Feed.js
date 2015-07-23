if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(['./FeederStore', './FeederCrawler'],
function (FeederStore, FeederCrawler) {
  var feederStore = new FeederStore(),
      feederCrawler = new FeederCrawler();

  return {
    add: function(link) {
      return feederCrawler
        .fetch(link)
        .then(function(feed) {
          return feederStore.save(feed);
        });
    },

    getArticles: function(name) {
      return feederStore.getArticles(name);
    }
  }
});