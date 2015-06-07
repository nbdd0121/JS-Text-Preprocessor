var config = require('./config');

var http = require('http');
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var url = require('url');

var Preprocessor = require('./Preprocessor');
var MIME = require('./MIME');
var Cache = require('./Cache');
var Async = require('./Async');

var pathCache = new Cache(function(filename, callback) {
  fs.lstat(filename, function(error, resolved) {
    if (error) {
      callback(null, null);
      return;
    }
    if (!resolved.isDirectory()) {
      callback(null, filename);
      return;
    }

    if (filename[filename.length - 1] != '/')
      filename += '/';

    var lists = ['index.html', 'index.jssp'];
    var tryOnce = function() {
      if (lists.length === 0) {
        callback(null, null);
        return;
      }
      var file = lists.shift();
      fs.lstat(filename + file, function(error, resolved) {
        if (error || resolved.isDirectory()) {
          tryOnce();
        } else {
          callback(null, filename + file);
        }
      });
    };
    tryOnce();
  });
}, 128);

var dataCache = new Cache(function(filename, callback) {
  fs.readFile(filename, function(error, content) {
    if (error) {
      callback(null, {
        type: '500',
        mime: 'text/html',
        data: '500 Internal Server Error<br/> ' + error.toString()
      });
    } else {
      if (path.extname(filename) === '.jssp') {
        callback(null, {
          type: 'JSSP',
          data: Preprocessor(content.toString())
        });
      } else {
        callback(null, {
          type: '200',
          mime: MIME(filename),
          data: content
        });
      }
    }
  });
}, 128);

var observers = Object.create(null);

dataCache.onEntryCreated = pathCache.onEntryCreated = function(name) {
  if (name in observers)
    return;
  try {
    observers[name] = fs.watch(name, function() {
      console.log(name + ' is changed');
      dataCache.invalidate(name);
      pathCache.invalidate(name);
    });
    console.log('  watching ' + name);
  } catch (e) {}
}

dataCache.onEntryRemoved = dataCache.onEntryRemoved = function(name) {
  if (name in observers) {
    console.log('  unwatch ' + name);
    observers[name].close();
    delete observers[name];
  }
}

http.createServer(function(request, response) {
  var filePath = '.' + url.parse(request.url).pathname;
  console.log('requesting ' + filePath);

  pathCache.get(filePath, function(error, resolved) {
    if (!resolved) {
      response.writeHead(404);
      response.end('404 File Not Found', 'utf-8');
    } else {
      if (resolved != filePath) {
        console.log('  redirected to ' + resolved);
        filePath = resolved;
      }


      dataCache.get(filePath, function(error, resolved) {
        if (resolved.type !== 'JSSP') {
          if (resolved.mime) {
            response.writeHead(resolved.type, {
              'Content-Type': resolved.mime
            });
          } else {
            response.writeHead(resolved.type);
          }
          response.end(resolved.data, 'utf-8');
        } else {
          runScript(request, response, resolved.data);
        }
      });
    }
  });
}).listen(config.port);
console.log('Server running at http://127.0.0.1:' + config.port + '/');

function runScript(request, response, script) {
  response.writeHead(200, {
    'Content-Type': 'text/html'
  });
  var sandbox = {
    print: function print(text) {
      response.write('' + text, 'utf-8');
    },
    request: request,
    response: response,
    require: require,
    Async: Async.Async,
    close: function(error) {
      if (error) {
        response.end('ERROR: ' + error);
      } else {
        response.end();
      }
    }
  };
  vm.createContext(sandbox);
  try {
    vm.runInContext(script, sandbox);
  } catch (e) {
    sandbox.close(e);
  }
}