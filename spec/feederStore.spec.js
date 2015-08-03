var FeederStore = require('../lib/FeederStore'),
    PouchDB = require('pouchdb'),
    bunyan = require('bunyan');

describe("FeederStore", function() {
  var store;

  beforeEach(function(done) {
    userdb = new PouchDB('tmp/feeder');
    userdb.destroy().then(function() {
      db = new PouchDB('tmp/feeder_user');
      db.destroy().then(function() {
        store = new FeederStore();
        store.setSettings({
          host: '',
          commondb : 'tmp/feeder',
          userdb: 'tmp/feeder_user',
          logger: function() {
            return bunyan.createLogger({ name: 'feeder_api' });
          }
        });
        done();
      });
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

    xit("does not include read articles in the unread count", function(done) {
      var feed = [{
        title: 'feed1',
        feed_link: 'http://feed.parser.test/feed1',
        articles: [{ link: 'http://feed.parser.test/article11', title: 'article1' }]
      },{
        title: 'feed1',
        feed_link: 'http://feed.parser.test/feed1',
        articles: [{ link: 'http://feed.parser.test/article12', title: 'article2' }]
      },{
        title: 'feed1',
        feed_link: 'http://feed.parser.test/feed1',
        articles: [{ link: 'http://feed.parser.test/article13', title: 'article3' },
                   { link: 'http://feed.parser.test/article14', title: 'article4' },
                   { link: 'http://feed.parser.test/article13', title: 'article3' }]
      }];
      store
        .save(feed[0])
        .then(function(res) {
          expect(res.feed.unread_count).toBe(0);
          expect(res.feed.articles.length).toBe(1);
          return res;
        })
        .then(function() {
          return store
            .save(feed[1])
            .then(function(res) {
              expect(res.feed.unread_count).toBe(1);
              expect(res.feed.articles.length).toBe(1);
              return res;
            });
        })
        .then(function() {
          return store
            .save(feed[2])
            .then(function(res) {
              expect(res.feed.unread_count).toBe(3);
              expect(res.feed.articles.length).toBe(2);
              done();
              return res;
            });
          });
    });

  });
});