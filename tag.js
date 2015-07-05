define(['pouchdb', 'feedparser', 'request'],
function (PouchDB, FeedParser, request) {
  var db = new PouchDB('http://localhost:5984/feeder'),
      log;

  PouchDB.plugin(require('pouchdb-upsert'));

  function tag(feed, tag) {
    db.upsert('tag_' + tag, function(doc) {
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
          favicon: feed.favicon
        });
      }
      return doc;
    }).then(function(doc) {
      db.get('tag_' + tag).then(function(tag_doc) {
        log.debug(tag_doc);
      });
    }).catch(function(err) {
      log.error(err);
    });
  };

  return {
    tag: function(link, cb) {
      tag(link, cb);
    },

    setLogger: function(_log) {
      log = _log;
    }
  }
});
