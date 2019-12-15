'use strict';

const processFn = (fn, options, proxy, unwrapped) => function (...args) {
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

		const self = this === proxy ? unwrapped : this;
		Reflect.apply(fn, self, args);
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
		const desc = Reflect.getOwnPropertyDescriptor(target, key);
		const writableOrConfigurable = (desc === undefined || desc.writable || desc.configurable);
		const included = options.include ? options.include.some(match) : !options.exclude.some(match);
		const shouldFilter = included && writableOrConfigurable;
		cached[key] = shouldFilter;
		return shouldFilter;
	};

	const cache = new WeakMap();

	const proxy = new Proxy(input, {
		apply(target, thisArg, args) {
			const cached = cache.get(target);

			if (cached) {
				return Reflect.apply(cached, thisArg, args);
			}

			const pified = options.excludeMain ? target : processFn(target, options, proxy, target);
			cache.set(target, pified);
			return Reflect.apply(pified, thisArg, args);
		},

		get(target, key) {
			const prop = target[key];

			if (!filter(target, key) || prop === Function.prototype.bind) {
				return prop;
			}

			const cached = cache.get(prop);

			if (cached) {
				return cached;
			}

			if (typeof prop === 'function') {
				const pified = processFn(prop, options, proxy, target);
				cache.set(prop, pified);
				return pified;
			}

			return prop;
		}
	});

	return proxy;
};
