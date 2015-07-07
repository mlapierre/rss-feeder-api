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

  describe("when feed is fetched", function() {
    it("returns 'success' and the feed", function(done) {
      crawler.fetch('http://feeds.gawker.com/lifehacker/full')
             .then(function(res) {
                expect(res._id).toBe('abc');
                done();
             });
    });
  });
});