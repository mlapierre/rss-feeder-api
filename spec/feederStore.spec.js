var FeederStore = require('../lib/FeederStore');

describe("FeederStore", function() {
  var store;

  beforeAll(function() {
    store = new FeederStore('tmp/feeder_test');
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
  });
});