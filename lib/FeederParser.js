if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(['feedparser', 'q', '../conf/config'],
function (FParser, Q, config) {
  function FeederParser() {
    this.log = config.logger();
  };

  FeederParser.prototype.parse = function(response) {
    var parser = new FParser(),
        feed = {},
        deferred = Q.defer(),
        log = this.log;
    feed.articles = [];
    response.pipe(parser);

    parser.on('error', function(err) {
      log.debug('processing error');
      deferred.reject(err);
    });

    parser.on('end', function () {
      log.debug('processing end');
      if (feed.hasOwnProperty('type')) {
        deferred.resolve(feed);
      } else {
        deferred.reject(feed);
      }
    });

    parser.on('meta', function(meta) {
      log.debug('processing meta');

      feed.type = "feed";
      feed.title = meta.title;
      feed.website_link = meta.link;
      feed.description = meta.description;
      feed.feed_link = response.request.uri.href;
      feed.updated_at = meta.date;
      feed.published_at = meta.pubdate;
      feed.author = meta.author;
      feed.image = meta.image;
      feed.favicon = meta.favicon;
      feed.language = meta.language;
      feed.copyright = meta.copyright;
      feed.generator = meta.generator;
      feed.categories = meta.categories;
    });

    parser.on('readable', function() {
      log.debug('processing readable');
      var item;
      while (item = this.read()) {
        item.type = "article";
        item.published_at = item.pubdate;
        item.content = item.description;

        feed.articles.push(item);
      }
    });

    return deferred.promise;
  };

  return FeederParser;
});