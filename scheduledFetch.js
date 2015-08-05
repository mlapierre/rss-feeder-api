var requirejs = require('requirejs');

requirejs.config({
    //Pass the top-level main.js/index.js require
    //function to requirejs so that node modules
    //are loaded relative to the top-level JS file.
    nodeRequire: require,
    baseUrl: 'lib'
});

requirejs(['request', 'FeederStore', 'FeederCrawler', 'node-schedule', 'bunyan', 'node-resque', 'Feed', 'memwatch-next'],
function   (request, FeederStore, FeederCrawler, schedule, bunyan, NR, Feed, memwatch) {
  var feederStore = new FeederStore(),
      feederCrawler = new FeederCrawler(),
      log = bunyan.createLogger({ name: 'feeder_api'}),
      worker,
      jobsToComplete = 0;

  var connectionDetails = {
    package:   "redis",
    host:      "127.0.0.1",
    password:  "",
    port:      6379,
    database:  0,
  }

  var jobs = {
    "fetch": {
      perform: function(feed_link, callback){
        feederCrawler
          .getFeed(feed_link)
          .then(function(feed) {
            feederStore.save(feed).then(function(result) {
              jobsToComplete--;
              shutdown();
              callback(null, 'updated: ' + result.updated);
            });
          }).catch(function(err) {
            log.error(err);
            throw err;
            callback(null);
          }).done();
      },
    }
  }

  log.level("debug");

  memwatch.on('stats', function(stats) { log.debug(stats); });

  log.info('Starting Feed Fetch Scheduler');

  schedule.scheduleJob("*/5 * * * *", function(){
    log.info('Queuing feed updates...');

    var hd1 = new memwatch.HeapDiff();
    var hd2 = new memwatch.HeapDiff();

    worker = new NR.worker({connection: connectionDetails, queues: "feed_fetch"}, jobs, function() {
      worker.workerCleanup(); // optional: cleanup any previous improperly shutdown workers on this host
      worker.start();
    });

    worker.on('start',           function(){ log.info("worker started"); })
    worker.on('end',             function(){ log.info("worker ended"); })
    worker.on('cleaning_worker', function(worker, pid){ log.info("cleaning old worker " + worker); })
    worker.on('poll',            function(queue){ log.info("worker polling " + queue); })
    worker.on('job',             function(queue, job){ log.info("working job " + queue + " " + JSON.stringify(job)); })
    worker.on('reEnqueue',       function(queue, job, plugin){ log.info("reEnqueue job (" + plugin + ") " + queue + " " + JSON.stringify(job)); })
    worker.on('success',         function(queue, job, result){ log.info("job success " + queue + " " + JSON.stringify(job) + " >> " + result); })
    worker.on('failure',         function(queue, job, failure){ log.error("job failure " + queue + " " + JSON.stringify(job) + " >> " + failure); })
    worker.on('error',           function(queue, job, error){ log.error("error " + queue + " " + JSON.stringify(job) + " >> " + error); })
    worker.on('pause',           function(){ log.info("worker paused"); })

    var queue = new NR.queue({connection: connectionDetails}, jobs, function(){
      feederStore.getAllFeeds()
        .then(function(feeds) {
          jobsToComplete = feeds.length;
          feeds.forEach(function(feed) {
            queue.enqueue('feed_fetch', "fetch", feed.feed_link);
          });

          // jobsToComplete = 3;
          // for (var i = 0; i < 3; i++ ) {
          //   queue.enqueue('feed_fetch', "fetch", feeds[i].feed_link);
          // }

          log.debug(hd2.end());

        }).catch(function(err) {
          log.error(err);
        }).done();
    });

    log.debug(hd1.end());
  });

  function shutdown() {
    if(jobsToComplete === 0){
      setTimeout(function(){
        worker.end();
      }, 500);
    }
  }
});