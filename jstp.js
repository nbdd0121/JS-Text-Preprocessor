var fs = require('fs');
var vm = require('vm');
var Preprocessor = require('./Preprocessor');
var Async = require('./Async');

/* Context for the code to run */
var sandbox = {
	print: function print(text) {
		process.stdout.write('' + text);
	},
	require: require,
	Async: Async.Async,
	close: function(error) {
		if (error) {
			console.log('ERROR: ' + e);
		}
	}
};
vm.createContext(sandbox);

if (process.argv.length < 3) {
	console.log("No input");
} else {
	vm.runInContext(
		Preprocessor(
			fs.readFileSync(process.argv[2]).toString()
		), sandbox
	);
}