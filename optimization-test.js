/* eslint-disable no-fallthrough */
import process from 'node:process';
import assert from 'node:assert';
import v8 from 'v8-natives';
import pify from './index.js';

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
	unicorn(callback) {
		callback(null, 'unicorn');
	},
});

try {
	await fn.unicorn();
	v8.optimizeFunctionOnNextCall(fn.unicorn);
	await fn.unicorn();
	assertOptimized(fn.unicorn, 'unicorn');
} catch (error) {
	console.error(error);
	process.exit(1); // eslint-disable-line unicorn/no-process-exit
}
