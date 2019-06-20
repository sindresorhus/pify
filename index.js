'use strict';

const processFn = (fn, options) => function (...args) {
	const P = options.promiseModule;

	return new P((resolve, reject) => {
		if (options.multiArgs) {
			args.push((...result) => {
				if (options.errorFirst) {
					if (result[0]) {
						reject(result);
					} else {
						result.shift();
						resolve(result);
					}
				} else {
					resolve(result);
				}
			});
		} else if (options.errorFirst) {
			args.push((error, result) => {
				if (error) {
					reject(error);
				} else {
					resolve(result);
				}
			});
		} else {
			args.push(resolve);
		}

		Reflect.apply(fn, this, args);
	});
};

const filterCache = new WeakMap();

module.exports = (input, options) => {
	options = Object.assign({
		exclude: [/.+(Sync|Stream)$/],
		errorFirst: true,
		promiseModule: Promise
	}, options);

	const objType = typeof input;
	if (!(input !== null && (objType === 'object' || objType === 'function'))) {
		throw new TypeError(`Expected \`input\` to be a \`Function\` or \`Object\`, got \`${input === null ? 'null' : objType}\``);
	}

	const filter = (target, key) => {
		let cached = filterCache.get(target);

		if (!cached) {
			cached = {};
			filterCache.set(target, cached);
		}

		if (key in cached) {
			return cached[key];
		}

		const match = pattern => (typeof pattern === 'string' || typeof key === 'symbol') ? key === pattern : pattern.test(key);
		const shouldFilter = options.include ? options.include.some(match) : !options.exclude.some(match);
		cached[key] = shouldFilter;
		return shouldFilter;
	};

	const cache = new WeakMap();

	const handler = {
		apply(target, thisArg, args) {
			const cached = cache.get(target);

			if (cached) {
				return Reflect.apply(cached, thisArg, args);
			}

			const pified = options.excludeMain ? target : processFn(target, options);
			cache.set(target, pified);
			return Reflect.apply(pified, thisArg, args);
		},

		get(target, key) {
			const prop = target[key];

			if (!filter(target, key)) {
				return prop;
			}

			const cached = cache.get(prop);

			if (cached) {
				return cached;
			}

			if (typeof prop === 'function') {
				const pified = processFn(prop, options);
				cache.set(prop, pified);
				return pified;
			}

			return prop;
		}
	};

	return new Proxy(input, handler);
};
