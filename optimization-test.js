/* eslint-disable no-fallthrough */
'use strict';
const assert = require('assert');
const v8 = require('v8-natives');
const pify = require('.');

function assertOptimized(fn, name) {
	const status = v8.getOptimizationStatus(fn);

	switch (status) {
		case 1:
			// `fn` is optimized
			console.log('pify is optimized');
			return;
		case 2:
			assert(false, `${name} is not optimized (${status})`);
		case 3:
			// `fn` is always optimized
			return;
		case 4:
			assert(false, `${name} is never optimized (${status})`);
		case 6:
			assert(false, `${name} is maybe deoptimized (${status})`);
		default:
			assert(false, `unknown OptimizationStatus: ${status} (${name})`);
	}
}

const sut = pify({
	unicorn: cb => {
		cb(null, 'unicorn');
	}
});

sut.unicorn().then(() => {
	v8.optimizeFunctionOnNextCall(sut.unicorn);

	return sut.unicorn().then(() => {
		assertOptimized(sut.unicorn, 'unicorn');
	});
}).catch(err => {
	console.error(err.stack);
	process.exit(1); // eslint-disable-line unicorn/no-process-exit
});
