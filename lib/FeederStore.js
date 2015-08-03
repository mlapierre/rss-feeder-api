if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(['pouchdb', 'q', '../conf/config', 'mongodb'],
function (PouchDB, Q, config, mongodb) {
  var db,
      pagedb,
      userdb,
      htmldb;

  PouchDB.plugin(require('pouchdb-upsert'));

  function FeederStore() {
    init(config);
  };

  function init(config) {
    db = new PouchDB(config.feederdb.common);
    userdb = new PouchDB(config.feederdb.user);
    htmldb = new PouchDB(config.feederdb.html);
    config.pagedb = config.pagedb;
  }

  FeederStore.prototype.setSettings = function(config) {
    init(config);
  }

  FeederStore.prototype.getAllArticles = function() {
    var deferred = Q.defer();

    db.allDocs({
      include_docs: true,
      startkey: 'article_',
      endkey: 'article_\uffff'
    }).then(function(result){
      var articles = result.rows.map(function(row) {
        return row.doc;
      });
      deferred.resolve(articles);
    }).catch(function(err) {
      deferred.reject(err);
    });

    return deferred.promise;
  }

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

  FeederStore.prototype.getFeedArticles = function(name) {
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

  FeederStore.prototype.saveArticleHTML = function(link, html) {
    var deferred = Q.defer();

    mongodb.MongoClient.connect(config.pagedb, function(err, db) {
      if (err) {
        deferred.reject(err);
        return deferred.promise;
      }

      var grid = new mongodb.GridStore(db, link, 'w');
      var buffer = new Buffer(html);

      grid.open().then(function(grid) {
        return grid.write(buffer).then(function(grid) {
          return grid.close().then(function(result) {
            deferred.resolve( { status: 'success', html: html, result: result } );
            db.close();
          });
        });
      }).catch(function(err) {
        deferred.reject(err);
      })
    });
    return deferred.promise;
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
        unread_count;

    feed._id = 'feed_' + toPlainStr(feed.title) + '_' + feed.feed_link;
    feed.ref = toPlainStr(feed.title);

    saveArticles(feed).then(function(res) {
      var errors = [];
      res.forEach(function(result) {
        if (result.state === 'fulfilled') {
          if (result.value.updated) {
            new_articles.push(result.value.article);
          }
        } else {
          errors.push(result.reason);
        }
      });
      if (errors.length > 0) {
        deferred.reject(errors);
      }
    }).then(function() {
      // Count unread articles
      return userdb.allDocs({
        include_docs: true,
        startkey: 'article_' + feed.ref,
        endkey: 'article_' + feed.ref + '_\uffff'
      }).then(function(docs) {
        return docs.rows.filter(function(res) {
          return res.doc.read_at;
        });
      }).then(function(read) {
        return db.allDocs({
          include_docs: true,
          startkey: 'article_',
          endkey: 'article_\uffff'
        }).then(function(docs) {
          var unread = docs.rows.filter(function(res) {
            return res.doc.feed_ref === feed.ref;
          });
          return unread.length - read.length;
        });
      });
    }).then(function(res) {
      unread_count = res;
      feed.articles = [];
      db.upsert(feed._id, function(doc) {
        // If doc doesn't have an _id property, the feed is new
        if (!doc.hasOwnProperty('_id')) {
          feed.unread_count = unread_count;
          return feed;
        }
        // Otherwise update any changed fields
        doc.unread_count = unread_count;
        for (prop in feed) {
          if (prop != 'unread_count' && feed[prop] != doc[prop]) {
            return doc;
          }
        }
        // If there are no changes, skip the update
        return false;
      }).then(function (doc) {
        db.get(feed._id).then(function(item) {
          item.articles = new_articles;
          deferred.resolve({ updated: doc.updated, feed: item });
        });
      }).then(function() {
        userdb.allDocs({
          include_docs: true,
          startkey: 'tag_',
          endkey: 'tag_\uffff'
        }).then(function(res) {
          var tagged;
          res.rows.forEach(function(row) {
            row.doc.feeds.forEach(function(_feed) {
              if (_feed.ref === feed.ref) {
                tagged = true;
              }
            });

            userdb.upsert(row.doc._id, function(doc) {
              var updated = false;
              doc.feeds.forEach(function(_feed) {
                if (_feed.ref === feed.ref) {
                  if (_feed.unread_count !== unread_count) {
                    _feed.unread_count = unread_count;
                    updated = true;
                  }
                }
              });
              if (updated) {
                return doc;
              }
              return false;
            });
          });

          if (!tagged) {
            userdb.upsert('tag_untagged', function(doc) {
              if (!doc.feeds) {
                doc.feeds = [];
              }
              feed.unread_count = unread_count;
              doc.feeds.push(feed);
              return doc;
            });
          }
        }).catch(function(err) {
          deferred.reject(err);
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
      article.feed_ref = feed.ref;
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

