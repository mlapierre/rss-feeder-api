var requirejs = require('requirejs');

requirejs.config({
    //Pass the top-level main.js/index.js require
    //function to requirejs so that node modules
    //are loaded relative to the top-level JS file.
    nodeRequire: require,
    baseUrl: 'lib'
});

requirejs(['request', 'FeederStore', 'FeederCrawler', 'node-schedule', 'bunyan', 'Feed'],
function   (request, FeederStore, FeederCrawler, schedule, bunyan, Feed) {
  var feederStore = new FeederStore(),
      feederCrawler = new FeederCrawler(),
      log = bunyan.createLogger({ name: 'feeder_api'});

  // fetchAndSave('http://www.theregister.co.uk/headlines.atom');
  //fetchAndSave('http://www.polygon.com/rss/index.xml');
  // fetchAndSave('http://feeds.arstechnica.com/arstechnica/index');
  // fetchAndSave('http://feeds.gawker.com/lifehacker/full');

  var feeds = ["http://www.anandtech.com/rss/",
"http://feeds.gawker.com/lifehacker/full",
"http://feeds.lifehacker.com.au/LifehackerAustralia",
"http://www.engadget.com/rss.xml",
"https://theconversation.com/articles.atom",
"http://feeds.feedburner.com/blogspot/hsDu",
"http://www.polygon.com/rss/index.xml",
"http://feeds.arstechnica.com/arstechnica/index",
"http://www.slate.com/blogs/bad_astronomy.fulltext.all.10.rss/",
"http://blog.chromium.org/feeds/posts/default",
"http://electronupdate.blogspot.com/feeds/posts/default?alt=rss",
"http://feeds.feedburner.com/OfficialAndroidBlog",
"http://feeds.feedburner.com/blogspot/MKuf",
"http://www.androidpolice.com/topics/applications-games/feed/",
"http://www.androidpolice.com/topics/reviews/feed/",
"http://www.space.com/home/feed/site.xml",
"http://feeds2.feedburner.com/hackaday/LgoM",
"http://www.aaron-gustafson.com/atom.xml",
"http://onethingwell.org/rss",
"http://blog.marekrosa.org/feeds/posts/default",
"http://karpathy.github.io/feed.xml",
"http://page2rss.com/rss/00c5ad0fa1478a0a25200d2680692e84",
"http://page2rss.com/rss/28d4ca95c9dc203029048c028e7a12c1",
"http://www.theguardian.com/uk/technology/rss",
"http://feeds.feedburner.com/blogspot/gJZg",
"http://rss.sciencedirect.com/publication/science/00043702",
"http://www.jair.org/articles.rss",
"http://onlinelibrary.wiley.com/rss/journal/10.1111/(ISSN)1467-8640",
"http://ieeexplore.ieee.org/rss/TOC34.XML",
"http://retractionwatch.com/feed/",
"https://feeds.feedburner.com/NewAndUpdatedSummaries?format=xml",
"http://feeds.feedburner.com/BpsResearchDigest",
"http://www.bbc.co.uk/programmes/b015sqc7/episodes/downloads.rss",
"http://jmlr.org/jmlr.xml",
"https://medium.com/feed/google-developers",
"http://feeds.feedburner.com/OfficialGmailBlog",
"https://feeds.feedburner.com/DataKind",
"http://pages.kiva.org/kivablog/feed",
"https://blog.docker.com/feed/",
"http://feeds.feedburner.com/codinghorror",
"https://feeds2.feedburner.com/UnderstandingUncertainty",
"http://jakearchibald.com/posts.rss",
"https://feeds.feedburner.com/2ality",
"http://feeds.feedburner.com/se-radio",
"http://www.cbc.ca/podcasting/includes/spark.xml",
"http://www.theregister.co.uk/headlines.atom",
"http://www.theplatform.net/feed/",
"http://feeds.feedburner.com/webcomponentsorg/articles",
"http://www.codeforamerica.org/blog/feed/",
"http://www.xkcd.com/rss.xml",
"http://feeds.wired.com/wired/index",
"http://feeds.newscientist.com/science-news",
"https://www.fightaging.org/index.xml",
"http://www.kurzweilai.net/news/feed",
"http://rss.slashdot.org/Slashdot/slashdot",
"http://www.theverge.com/rss/frontpage",
"http://feeds.feedburner.com/alistapart/main",
"http://angularjs.blogspot.com/feeds/posts/default?alt=rss",
"http://feeds.feedburner.com/blogspot/RLXA",
"http://lesswrong.com/.rss"];

  // updateAll(feeds);
  fetchAndSave(feeds);

  function fetchAndSave(feeds) {
    if (feeds.length <= 0) {
        return;
    }
    var feed = feeds.shift();
    log.info('Fetching: ' + feed);

    Feed.add(feed).then(function() {
      fetchAndSave(feeds);
    }).catch(function(err) {
        log.error(err);
    }).done();
  };

  // function updateAll(feeds) {
  //   log.info('Starting Feed Update');
  //   // feederStore.getAllFeeds()
  //   //   .then(function(feeds) {
  //       feeds.forEach(function(feed) {
  //         fetchAndSave(feed);
  //       });
  //     // }).catch(function(err) {
  //     //   log.error(err);
  //     // }).done();
  //   };

  // function fetchAndSave(feed_link) {
  //   log.info('Fetching: ' + feed_link);
  //   feederCrawler
  //     .getFeed(feed_link)
  //     .then(function(feed) {
  //       feederStore.save(feed);
  //     }).catch(function(err) {
  //       log.error(err);
  //     }).done();
  // };


});