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

		fn.apply(this, args);
	});
};

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

	const filter = key => {
		const match = pattern => typeof pattern === 'string' ? key === pattern : pattern.test(key);
		return options.include ? options.include.some(match) : !options.exclude.some(match);
	};

	const cache = new WeakMap();

	const handler = {
		apply(target, thisArg, args) {
			const cached = cache.get(target);

			if (cached) {
				return cached.apply(thisArg, args);
			}

			const pified = options.excludeMain ? target : processFn(target, options);
			cache.set(target, pified);
			return pified.apply(thisArg, args);
		},

		get(target, key) {
			const prop = target[key];

			if (!filter(key)) {
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
