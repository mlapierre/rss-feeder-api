if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(['request', './FeederParser', 'q'],
function (request, FeederParser, Q) {
  function FeederCrawler() {
    this.log = '';
    this.parser = new FeederParser();
  };

  FeederCrawler.prototype.fetch = function(link) {
    var fc = this;
    return requestFeed(link).then(function(res) {
      return fc.parser.parse(res);
    });
  }

  FeederCrawler.prototype.save = function(feed) {
    this.log.debug(feed);
  };

  FeederCrawler.prototype.setLogger = function(log) {
    this.log = log;
    this.parser.setLogger(log);
  };


  // private methods

  function requestFeed(link) {
    var deferred = Q.defer();
    var req = request(link, {timeout: 5000, pool: false})
    req.setMaxListeners(50);
    req.setHeader('user-agent', 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.130 Safari/537.36')
    req.setHeader('accept', 'text/html,application/xhtml+xml');
    req.on('response', function(res) {
      deferred.resolve(res);
    });
    req.on('error', function(err) {
      deferred.reject(err);
    });
    return deferred.promise;
  }

  return FeederCrawler;
});