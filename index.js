'use strict';

const processFn = (fn, opts) => function () {
	const P = opts.promiseModule;
	const args = new Array(arguments.length);

	for (let i = 0; i < arguments.length; i++) {
		args[i] = arguments[i];
	}

	return new P((resolve, reject) => {
		if (opts.multiArgs) {
			args.push(function (err) {
				const results = new Array(arguments.length - 1);

				for (let i = 0; i < arguments.length; i++) {
					results[i] = arguments[i];
				}

				if (opts.errorFirst) {
					if (err) {
						reject(results);
					} else {
						results.shift();
						resolve(results);
					}
				} else {
					resolve(results);
				}
			});
		} else if (opts.errorFirst) {
			args.push((err, result) => {
				if (err) {
					reject(err);
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

module.exports = (obj, opts) => {
	opts = Object.assign({
		exclude: [/.+(Sync|Stream)$/],
		errorFirst: true,
		promiseModule: Promise
	}, opts);

	const objType = typeof obj;
	if (objType === 'string' || objType === 'undefined' || obj === null) {
		throw new TypeError(`Expected \`input\` to be a \`Function\` or \`Object\`, got \`${obj === null ? 'null' : objType}\``);
	}

	const filter = key => {
		const match = pattern => typeof pattern === 'string' ? key === pattern : pattern.test(key);
		return opts.include ? opts.include.some(match) : !opts.exclude.some(match);
	};

	let ret;
	if (objType === 'function') {
		ret = function () {
			if (opts.excludeMain) {
				return obj.apply(this, arguments);
			}

			return processFn(obj, opts).apply(this, arguments);
		};
	} else {
		ret = Object.create(Object.getPrototypeOf(obj));
	}

	for (const key in obj) { // eslint-disable-line guard-for-in
		const x = obj[key];
		ret[key] = typeof x === 'function' && filter(key) ? processFn(x, opts) : x;
	}

	return ret;
};
