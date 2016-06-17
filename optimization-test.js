/* eslint-disable no-fallthrough */
'use strict';
var assert = require('assert');
var Promise = require('pinkie-promise');
var v8 = require('v8-natives');
var fn = require('./');

function assertOptimized(fn, name) {
	var status = v8.getOptimizationStatus(fn);

	switch (status) {
		case 1:
			// fn is optimized
			return;
		case 2:
			assert(false, name + ' is not optimized (' + status + ')');
		case 3:
			// fn is always optimized
			return;
		case 4:
			assert(false, name + ' is never optimized (' + status + ')');
		case 6:
			assert(false, name + ' is maybe deoptimized (' + status + ')');
		default:
			assert(false, 'unknown OptimizationStatus: ' + status + ' (' + name + ')');
	}
}

var sut = fn({
	unicorn: function (cb) {
		cb(null, 'unicorn');
	}
}, Promise);

sut.unicorn().then(function () {
	v8.optimizeFunctionOnNextCall(sut.unicorn);

	return sut.unicorn().then(function () {
		assertOptimized(sut.unicorn, 'unicorn');
	});
}).catch(function (err) {
	console.log(err.stack);
	process.exit(1); // eslint-disable-line xo/no-process-exit
});
