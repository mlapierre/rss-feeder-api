define(['./FeederStore'],
function (FeederStore) {
  var feederStore = new FeederStore();

  return {
    tag: function(link, cb) {
      return feederStore.tag(link, cb);
    }
  }
});
