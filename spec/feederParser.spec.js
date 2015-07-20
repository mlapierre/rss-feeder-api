var FeederParser = require('../lib/FeederParser'),
    bunyan = require('bunyan'),
    request = require('request'),
    nock = require('nock'),
    stream = require('stream');

describe("FeederParser", function() {
  var log = bunyan.createLogger({ name: 'feeder_api' }),
      parser,
      uri = 'http://feed.parser.test',
      xml = '<rss version="2.0">' +
                '<channel>' +
                  '<title>FeedParser Test Feed</title>' +
                  '<description>FeedParser Test Feed Description</description>' +
                  '<link>http://feed.parser.test/</link>' +
                  '<pubdate>Mon, 06 Jul 2015 10:01:00 EDT</pubdate>' +
                  '<item>' +
                    '<title>Item 1 Title</title>' +
                    '<author>author person 1</author>' +
                    '<description>item 1 text or html description</description>' +
                    '<link>http://feed.parser.test/item1</link>' +
                    '<pubDate>Mon, 06 Jul 2015 01:00:00 EDT</pubDate>' +
                    '<guid isPermaLink="false">tag:feed.parser.test/item1,news</guid>' +
                    '<category>test 1 cat</category>' +
                  '</item>' +
                  '<item>' +
                    '<title>Item 2 Title</title>' +
                    '<author>author person 2</author>' +
                    '<description>item 2 text or html description</description>' +
                    '<link>http://feed.parser.test/item2</link>' +
                    '<pubDate>Mon, 06 Jul 2015 02:00:00 EDT</pubDate>' +
                    '<guid isPermaLink="false">tag:feed.parser.test/item2,news</guid>' +
                    '<category>test 2 cat</category>' +
                  '</item>' +
                '</channel>' +
                '</rss>';


  beforeEach(function() {
    //log.level('debug');
    parser = new FeederParser();
    parser.setLogger(log);
  });

  describe(".parse()", function() {
    var scope, req;
    beforeEach(function() {
      scope = nock(uri)
                  .get('/feed')
                  .reply(200, function() {
                    var s = new stream.Readable();
                    s.push(xml);
                    s.push(null);
                    return s;
                  });
      req = request(uri + '/feed');
    });

    it("returns the feed", function(done) {
      req.on('response', function(res) {
        //console.log(res);
        parser.parse(res)
              .then(function(feed) {
                expect(feed.type).toBe('feed');
                expect(feed.title).toBe('FeedParser Test Feed');
                expect(feed.description).toBe('FeedParser Test Feed Description');
                expect(feed.website_link).toBe('http://feed.parser.test/');
                expect(feed.updated_at).toEqual(new Date('Mon, 06 Jul 2015 10:01:00 EDT'));
                expect(feed.published_at).toEqual(new Date('Mon, 06 Jul 2015 10:01:00 EDT'));
                scope.done();
                done();
              });
      });
    });

    it("returns the feed articles", function(done) {
      req.on('response', function(res) {
        parser.parse(res)
              .then(function(feed) {
                expect(feed.articles.length).toBe(2);
                expect(feed.articles[0].title).toBe('Item 1 Title');
                expect(feed.articles[1].author).toBe('author person 2');
                expect(feed.articles[1].link).toBe('http://feed.parser.test/item2');
                expect(feed.articles[0].description).toBe('item 1 text or html description');
                expect(feed.articles[0].content).toBe('item 1 text or html description');
                expect(feed.articles[0].pubdate).toEqual(new Date('Mon, 06 Jul 2015 01:00:00 EDT'));
                expect(feed.articles[0].published_at).toEqual(new Date('Mon, 06 Jul 2015 01:00:00 EDT'));
                expect(feed.articles[1].guid).toBe('tag:feed.parser.test/item2,news');
                scope.done();
                done();
              });
      });

    });
  });
});