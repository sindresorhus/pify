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

const fn = pify({
	unicorn: callback => {
		callback(null, 'unicorn');
	}
});

(async () => {
	try {
		await fn.unicorn();
		v8.optimizeFunctionOnNextCall(fn.unicorn);
		await fn.unicorn();
		assertOptimized(fn.unicorn, 'unicorn');
	} catch (error) {
		console.error(error);
		process.exit(1); // eslint-disable-line unicorn/no-process-exit
	}
})();
