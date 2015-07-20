describe("Feed", function() {
  var feed = require('../lib/Feed')
    , bunyan = require('bunyan')
    , log = bunyan.createLogger({ name: 'feeder_api'});
  feed.setLogger(log);

  // beforeEach(function() {
  //   feed = new Feed();
  // });

  describe("when a new feed is added", function() {
    it("returns 'success' and the feed", function(done) {
      feed.add('http://example/feed', function(result) {
        expect(result.status).toBe('abc');
        done();
      });
    });

  });
});