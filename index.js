'use strict';

var processFn = function (fn, P, opts, bind) {
	return function () {
		var that = bind || this;
		var args = new Array(arguments.length);

		for (var i = 0; i < arguments.length; i++) {
			args[i] = arguments[i];
		}

		return new P(function (resolve, reject) {
			args.push(function (err, result) {
				if (err) {
					reject(err);
				} else if (opts.multiArgs) {
					var results = new Array(arguments.length - 1);

					for (var i = 1; i < arguments.length; i++) {
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
};

var pify = module.exports = function (obj, P, opts) {
	if (typeof P !== 'function') {
		opts = P;
		P = Promise;
	}

	opts = opts || {};
	var exclude = opts.exclude || [/.+Sync$/];
	var bind = opts.bind === false ? false : (opts.bind || obj);

	if (bind === true) {
		bind = obj;
	}

	var filter = function (key) {
		var match = function (pattern) {
			return typeof pattern === 'string' ? key === pattern : pattern.test(key);
		};

		return opts.include ? opts.include.some(match) : !exclude.some(match);
	};

	var ret = typeof obj === 'function' ? function () {
		if (opts.excludeMain) {
			return obj.apply(this, arguments);
		}

		return processFn(obj, P, opts).apply(this, arguments);
	} : {};

	return Object.keys(obj).reduce(function (ret, key) {
		var x = obj[key];

		if (typeof x === 'function') {
			if (filter(key)) {
				x = processFn(x, P, opts, bind);
			}

			ret[key] = x;
		} else if (bind) {
			Object.defineProperty(ret, key, {
				enumerable: true,
				configurable: true,
				get: function () {
					return bind[key];
				},
				set: function (val) {
					bind[key] = val;
				}
			});
		} else {
			ret[key] = x;
		}

		return ret;
	}, ret);
};

pify.all = pify;
