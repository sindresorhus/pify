'use strict';

const processFn = (fn, opts) => function () {
	const that = this;
	const P = opts.promiseModule;
	const args = new Array(arguments.length);

	for (let i = 0; i < arguments.length; i++) {
		args[i] = arguments[i];
	}

	return new P((resolve, reject) => {
		args.push(function (err, result) {
			if (err) {
				reject(err);
			} else if (opts.multiArgs) {
				const results = new Array(arguments.length - 1);

				for (let i = 1; i < arguments.length; i++) {
					results[i - 1] = arguments[i];
				}

				resolve(results);
			} else {
				resolve(result);
			}
		});

		fn.apply(that, args);
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

	let ret = {};
	if (typeof obj === 'function') {
		ret = function () {
			if (opts.excludeMain) {
				return obj.apply(this, arguments);
			}

			return processFn(obj, opts).apply(this, arguments);
		};
	} else if (opts.inherited) {
		ret = Object.create(Object.getPrototypeOf(obj));
	}

	for (const key in obj) {
		if (opts.inherited || hasOwnProperty.call(obj, key)) {
			const x = obj[key];
			ret[key] = typeof x === 'function' && filter(key) ? processFn(x, opts) : x;
		}
	}

	return ret;
};
