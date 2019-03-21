'use strict';

const processFn = (fn, opts) => function (...args) {
	const P = opts.promiseModule;

	return new P((resolve, reject) => {
		args.push((err, result, ...results) => {
			if (err) {
				reject(err);
			} else if (opts.multiArgs) {
				resolve([result, ...results]);
			} else {
				resolve(result);
			}
		});

		fn.apply(this, args);
	});
};

module.exports = (obj, opts) => {
	opts = Object.assign({
		exclude: [/.+Sync$/],
		promiseModule: Promise
	}, opts);

	const filter = key => {
		const match = pattern => typeof pattern === 'string' ? key === pattern : pattern.test(key);
		return opts.include ? opts.include.some(match) : !opts.exclude.some(match);
	};

	const cache = new Map();

	const handler = {
		get: (target, key) => {
			let cached = cache.get(key);

			if (!cached) {
				const x = target[key];

				cached = typeof x === 'function' && filter(key) ? processFn(x, opts) : x;
				cache.set(key, cached);
			}

			return cached;
		}
	};

	if (!opts.excludeMain) {
		const main = Symbol('main');

		handler.apply = (target, thisArg, argumentsList) => {
			let cached = cache.get(main);

			if (!cached) {
				cached = processFn(target, opts);
				cache.set(main, cached);
			}

			return cached.apply(thisArg, argumentsList);
		};
	}

	return new Proxy(obj, handler);
};
