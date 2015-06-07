function Cache(fallback, size) {
  this.fallback = fallback;
  this.data = Object.create(null);
  this.order = [];
  this.size = size;
  this.onEntryCreated = function() {};
  this.onEntryRemoved = function() {};
}

Cache.prototype.get = function(name, callback) {
  if (name in this.data) {
    // Retrieve entry
    var ret = this.data[name];
    // Put the item in the end of queue
    this.order.splice(this.order.indexOf(name), 1);
    this.order.push(name);

    // Trigger a callback
    setTimeout(function() {
      callback(null, ret);
    }, 0);
  } else {
    // Remove items in cache if too many
    if (this.order.length >= this.size) {
      var removed = this.order.shift();
      delete this.data[removed];
      this.onEntryRemoved(removed);
    }
    var that = this;
    this.fallback(name, function(error, resolved) {
      if (error) {
        callback(error, null);
      } else {
        that.data[name] = resolved;
        that.order.push(name);
        that.onEntryCreated(name);
        callback(null, resolved);
      }
    });
  }
};

Cache.prototype.invalidate = function(name) {
  var index = this.order.indexOf(name);
  if (index === -1)
    return;
  this.order.splice(index, 1);
  this.onEntryRemoved(name);
  delete this.data[name];
}

module.exports = Cache;