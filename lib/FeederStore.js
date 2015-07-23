if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(['pouchdb', 'q', './Settings'],
function (PouchDB, Q, Settings) {
  var db;

  PouchDB.plugin(require('pouchdb-upsert'));

  function FeederStore() {
    db = new PouchDB(Settings.host + Settings.commondb);
    userdb = new PouchDB(Settings.host + Settings.userdb);
  };

  FeederStore.prototype.getAllFeeds = function() {
    var deferred = Q.defer();

    db.allDocs({
      include_docs: true,
      startkey: 'feed_',
      endkey: 'feed_\uffff'
    }).then(function(result){
      var feeds = result.rows.map(function(row) {
        return row.doc;
      });
      deferred.resolve(feeds);
    }).catch(function(err) {
      deferred.reject(err);
    });

    return deferred.promise;
  };

  FeederStore.prototype.getArticles = function(name) {
    var deferred = Q.defer();

    db.allDocs({
      include_docs: true,
      startkey: 'feed_' + toPlainStr(name),
      endkey: 'feed_' + toPlainStr(name) + '\uffff',
    }).then(function(result){
      if (result.rows.length > 1) {
        deferred.reject({ error: 'Too many results for feed: ' + name});
      } else {
        deferred.resolve(result.rows[0].doc.articles);
      }
    }).catch(function(err) {
      deferred.reject(err);
    });

    return deferred.promise;
  };

  FeederStore.prototype.save = function(_feed) {
    return saveFeed(_feed);
  };

  FeederStore.prototype.tag = function(feed, tag) {
    var deferred = Q.defer();

    userdb.upsert('tag_' + tag, function(doc) {
      var isFeedInTag = [];
      if (doc.hasOwnProperty('feeds') && doc.feeds.length > 0) {
        var isFeedInTag = doc.feeds.filter(function(_feed){
          if (_feed._id === feed._id) {
            return true;
          }
          return false;
        });
      } else {
        doc.feeds = [];
      }
      if (isFeedInTag.length === 0) {
        doc.feeds.push({
          _id: feed._id,
          title: feed.title,
          favicon: feed.favicon,
          unread_count: feed.unread_count
        });
      }
      return doc;
    }).then(function(doc) {
      userdb.get('tag_' + tag).then(function(tag_doc) {
        deferred.resolve(tag_doc);
      });
    }).catch(function(err) {
      deferred.reject(err);
    });

    return deferred.promise;
  };


  // private methods

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

  function getRandString(num) {
    var str = '';
    for (var i=0; i<=Math.ceil(num/18); i++) {
      str += (Math.random()+1).toString(36).slice(2,18);
    }
    return str.substr(0,num);
  }

  function toPlainStr(str) {
    return encodeURIComponent(str.replace(/[\s\W]/g, '').toLowerCase());
  }

  function saveFeed(feed) {
    var deferred = Q.defer(),
        new_articles = [],
        errors = [];

    feed._id = 'feed_' + toPlainStr(feed.title) + '_' + feed.feed_link;
    feed.ref = toPlainStr(feed.title);

    saveArticles(feed).then(function(res) {
        res.forEach(function(result) {
          if (result.state === 'fulfilled') {
            if (result.value.updated) {
              new_articles.push(result.value.article);
            }
          } else {
            errors.push(result.reason);
          }
        });
    }).then(function() {
      feed.articles = [];
      db.upsert(feed._id, function(doc) {
        // If doc doesn't have an _id property, the feed is new
        if (!doc.hasOwnProperty('_id')) {
          feed.unread_count = new_articles.length;
          return feed;
        }

        if (!doc.unread_count) {
          doc.unread_count = 0;
        }
        doc.unread_count += new_articles.length;

        // Otherwise update any changed fields
        for (prop in feed) {
          if (prop != 'unread_count' && feed[prop] != doc[prop]) {
            return doc;
          }
        }

        // If there are no changes, skip the update
        return false;
      })
      .then(function (doc) {
        db.get(feed._id).then(function(item) {
          item.articles = new_articles;
          deferred.resolve({ updated: doc.updated, feed: item });
        });
      }).catch(function (err) {
        deferred.reject(err);
      });
    });

    return deferred.promise;
  }

  function saveArticles(feed) {
    var db_promises = [];
    feed.articles.forEach(function(article) {
      var deferred = Q.defer();
      article._id = getArticleId(article);
      article.feed_id = feed._id;
      article.id = getRandString(32);

      db.putIfNotExists(article)
        .then(function (doc) {
          db.get(getArticleId(article)).then(function(item) {
            deferred.resolve({ updated: doc.updated, article: item });
          }).catch(function (err) {
            deferred.reject(err);
          });
      });
      db_promises.push(deferred.promise);
    });
    return Q.allSettled(db_promises);
  }

  return FeederStore;
});
