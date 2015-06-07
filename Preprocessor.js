var util = require('util');

var defaultOptions = {
	print: 'print'
};

module.exports = function(text, options) {
	if (!options) options = {};
	util._extend(options, defaultOptions);

	var blocks = text.split('<%');
	var ret = 'Async(function*(){' + options.print + '(' + JSON.stringify(blocks[0]) + ');';
	for (var i = 1; i < blocks.length; i++) {
		var parts = blocks[i].split('%>');
		var code = parts[0];
		if (code[0] == '=') {
			code = options.print + '(' + code.substring(1) + ');';
		}
		ret += code + options.print + '(' + JSON.stringify(parts[1]) + ');';
	}
	ret += '})().then(function(){close();}, function(error){close(error);});';
	return ret;
}