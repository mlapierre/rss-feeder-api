if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(['pouchdb', 'q'],
function (PouchDB, Q) {
  var db;

  PouchDB.plugin(require('pouchdb-upsert'));

  function FeederStore(_db) {
    db = new PouchDB(_db);
  };

  FeederStore.prototype.getArticles = function(name) {
    var deferred = Q.defer();

    db.allDocs({
      include_docs: true,
      startkey: 'feed_' + name,
      endkey: 'feed_' + name + '\uffff',
    }).then(function(result){
      if (result.rows.length > 1) {
        console.log(result);
        deferred.reject({ error: 'Too many results for feed: ' + name});
      } else {
        deferred.resolve(result.rows[0].doc.articles);
      }
    }).catch(function(err) {
      deferred.reject(err);
    });

    return deferred.promise;
  }

  FeederStore.prototype.save = function(feed) {
    var deferred = Q.defer(),
        errors = [],
        _feed;

    saveFeed(feed)
      .then(function(__feed) {
        _feed = __feed;
        return saveArticles(feed);
      })
      .then(function(results) {
        _feed.feed.articles = [];
        results.forEach(function(result) {
          if (result.state === 'fulfilled') {
            _feed.feed.articles.push(result.value);
          } else {
            errors.push(result.reason);
          }
        });
        if (errors.length > 0) {
          deferred.reject(errors);
        } else {
          deferred.resolve(_feed);
        }
    }).done();
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
  };

  function saveFeed(feed) {
    var deferred = Q.defer(),
        doc;

    feed._id = 'feed_' + encodeURIComponent(feed.title.toLowerCase()) + '_' + feed.feed_link;

    db.upsert(feed._id, function(doc) {
      // If doc doesn't have an _id property, the feed is new
      if (!doc.hasOwnProperty('_id')) {
        return feed;
      }

      // Otherwise update any changed fields
      for (prop in feed) {
        if (feed[prop] != doc[prop]) {
          return doc;
        }
      }

      // If there are no changes, skip the update
      return false;
    })
    .then(function (doc) {
      db.get(feed._id).then(function(item) {
        deferred.resolve({ updated: doc.updated, feed: item });
      });
    }).catch(function (err) {
      deferred.reject(err);
    });

    return deferred.promise;
  };

  function saveArticles(feed) {
    var db_promises = [];
    feed.articles.forEach(function(article) {
      var deferred = Q.defer();
      article._id = getArticleId(article);

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
  };

  return FeederStore;
});
