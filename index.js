'use strict';

const processFn = (fn, opts) => function () {
	const that = this;
	const P = opts.promiseModule;
	const args = [].slice.call(arguments);

	return new P((resolve, reject) => {
		args.push(function (err, result) {
			if (err) {
				reject(err);
			} else if (opts.multiArgs) {
				const results = [].slice.call(arguments, 1);
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

	const ret = typeof obj === 'function' ? function () {
		if (opts.excludeMain) {
			return obj.apply(this, arguments);
		}

		return processFn(obj, opts).apply(this, arguments);
	} : {};

	return Object.keys(obj).reduce((ret, key) => {
		const x = obj[key];
		ret[key] = typeof x === 'function' && filter(key) ? processFn(x, opts) : x;
		return ret;
	}, ret);
};
