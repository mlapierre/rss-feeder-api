var FeederCrawler = require('../FeederCrawler')
  , bunyan = require('bunyan')
  , log = bunyan.createLogger({ name: 'feeder_api' });
//log.level('debug');

describe("FeederCrawler", function() {
  var crawler;

  beforeEach(function() {
    crawler = new FeederCrawler();
    crawler.setLogger(log);
  });

  describe(".fetch(link)", function() {
    it("returns a promise for a feed object", function(done) {
      crawler.fetch('http://feeds.gawker.com/lifehacker/full')
             .then(function(feed) {
                expect(feed._id).toBe('abc');
                done();
             });
    });
  });
});