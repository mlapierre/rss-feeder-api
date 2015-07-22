var FeederStore = require('../lib/FeederStore');
var PouchDB = require('pouchdb');

describe("FeederStore", function() {
  var store;

  beforeAll(function(done) {
    db = new PouchDB('tmp/feeder_test');
    db.destroy().then(function() {
      store = new FeederStore('tmp/feeder_test');
      done();
    });
    //store = new FeederStore('http://localhost:5984/feeder_test');
  });

  describe(".save(feed)", function() {
    it("saves the feed and articles to the database and returns a promise for a feed object", function(done) {
      var feed = {
        title: 'feed1',
        feed_link: 'http://feed.parser.test/feed1',
        articles: []
      };
      store
        .save(feed)
        .then(function(res) {
          expect(res.feed._id).toBe('feed_feed1_http://feed.parser.test/feed1');
      });

      feed = {
        feed_link: 'http://feed.parser.test/feed2',
        title: 'feed2',
        articles: []
      };
      store
        .save(feed)
        .then(function(res) {
          expect(res.feed._id).toBe('feed_feed2_http://feed.parser.test/feed2');
          done();
      });
    });

    it("increments the unread count when new articles are saved", function(done) {
      var feed = {
        title: 'feed1',
        feed_link: 'http://feed.parser.test/feed1',
        articles: [{ link: 'http://feed.parser.test/article11', title: 'article1' }]
      };
      store
        .save(feed)
        .then(function(res) {
          expect(res.feed._id).toBe('feed_feed1_http://feed.parser.test/feed1');
          expect(res.feed.unread_count).toBe(1);

          feed = {
            title: 'feed1',
            feed_link: 'http://feed.parser.test/feed1',
            articles: [{ link: 'http://feed.parser.test/article12', title: 'article2' }]
          };
          store
            .save(feed)
            .then(function(res) {
              expect(res.feed._id).toBe('feed_feed1_http://feed.parser.test/feed1');
              expect(res.feed.unread_count).toBe(2);
              store
                .save(feed)
                .then(function(res) {
                  expect(res.feed.unread_count).toBe(2);
                  done();
              });

          });

      });

    });
  });
});