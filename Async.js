exports.Async = function(func) {
  return function() {
    var gen = func.apply(arguments);
    return new Promise(function(resolve, reject) {
      function step(action) {
        try {
          var next = action();
        } catch (e) {
          // Throw
          reject(e);
          return;
        }

        if (next.done) {
          // Return value
          resolve(next.value);
          return;
        } else {
          next.value.then(function(v) {
            step(function() {
              return gen.next(v);
            });
          }, function(e) {
            step(function() {
              return gen.throw(e);
            });
          });
        }
      }

      step(function() {
        // First Step
        return gen.next();
      });
    });
  };
}