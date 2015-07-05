define(['pouchdb', 'feedparser', 'request'],
function (PouchDB, FeedParser, request) {
  var db = new PouchDB('http://localhost:5984/feeder'),
      log;

  PouchDB.plugin(require('pouchdb-upsert'));

  function fetch(link, cb) {
    var feedparser = new FeedParser()
      , req = request(link, {timeout: 5000, pool: false})
      , feed
      , updated
      , articles = [];

    req.setMaxListeners(50);
    req.setHeader('user-agent', 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.130 Safari/537.36')
    req.setHeader('accept', 'text/html,application/xhtml+xml');

    req.on('error', function(err) {
      log.error(err);
      cb(err);
    });
    req.on('response', function(res) {
      if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));
      res.pipe(feedparser);
    });

    feedparser.on('error', function(err) {
      log.error(err);
      cb(err);
    });

    feedparser.on('end', function () {
      log.debug('processing end');
      if (feed) {
        var msg = 'Feed already added';
        if (updated) {
          msg = 'Added feed';
        }
        feed = {
          status: 'success',
          msg: msg,
          feed: feed
        };
      } else {
        feed = {
          status: 'error',
          error: feed
        };
      }
      saveArticles(feed._id, articles);
      cb(feed);
    });

    feedparser.on('meta', function(meta) {
      log.debug('processing meta');
      saveFeed(link, meta, function(_updated, res) {
        feed = res;
        updated = _updated;
        log.debug('feed: ' + feed);
      });
    });

    feedparser.on('readable', function() {
      log.debug('processing readable');
      var item;
      while (item = this.read()) {
        articles.push(item);
      }
    });
  };

  function getArticleId(article) {
    var id = 'article_' + article.link;
    if (id.length == 8) {
      id += article.title;
    }
    if (id.length == 8) {
      id += article.description;
    }
    return id;
  }

  function saveArticles(feed_id, articles, cb) {
    log.debug("feed_id: " + feed_id);
    articles.forEach(function(article) {
      db.putIfNotExists({
        "_id": getArticleId(article),
        "type": "article",
        "feed_id": feed_id,
        "title": article.title,
        "content": article.description,
        "summary": article.summary,
        "link": article.link,
        "origlink": article.origlink,
        "permalink": article.permalink,
        "guid": article.guid,
        "updated_at": article.date,
        "published_at": article.pubdate,
        "author": article.author,
        "image": article.image,
        "categories": article.categories,
        "comments": article.comments,
        "source": article.source,
        "enclosures": article.enclosures
      }).then(function (doc) {
        db.get(getArticleId(article)).then(function(item) {
          log.debug({ updated: doc.updated, article_id: item._id });
        });
      }).catch(function (err) {
        log.error(err);
      });
    });
  };

  function saveFeed(link, feed, _cb) {
    db.putIfNotExists({
      "_id": "feed_" + link,
      "type": "feed",
      "title": feed.title,
      "link": feed.link,
      "description": feed.description,
      "feed_link": feed.xmlurl,
      "updated_at": feed.date,
      "published_at": feed.pubdate,
      "author": feed.author,
      "image": feed.image,
      "favicon": feed.favicon,
      "language": feed.language,
      "copyright": feed.copyright,
      "generator": feed.generator,
      "categories": feed.categories
    }).then(function (doc) {
      db.get("feed_" + link).then(function(item) {
        log.debug({ updated: doc.updated, feed_id: item._id });
        _cb(doc.updated, item);
      });
    }).catch(function (err) {
      log.error(err);
      _cb(err);
    });
  };

  return {
    add: function(link, cb) {
      fetch(link, cb);
    },

    setLogger: function(_log) {
      log = _log;
    }
  }
});