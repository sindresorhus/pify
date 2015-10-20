'use strict';

var processFn = function (fn, P, opts) {
	if (typeof fn !== 'function') {
		return P.reject(new TypeError('Expected a function'));
	}

	return function () {
		var that = this;
		var args = [].slice.call(arguments);

		return new P(function (resolve, reject) {
			args.push(function (err, result) {
				if (err) {
					reject(err);
				} else if (opts.multiArgs) {
					resolve([].slice.call(arguments, 1));
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
	opts.exclude = opts.exclude || [/^.+Sync$/];

	var filter = function (key) {
		var check = function (patterns) {
			for (var i = 0; i < patterns.length; i++) {
				if (typeof patterns[i] === 'string') {
					if (key === patterns[i]) {
						return true;
					}
				} else if ((new RegExp(patterns[i])).test(key)) {
					return true;
				}
			}

			return false;
		};

		return (opts.include) ? check(opts.include) : !check(opts.exclude);
	};

	var ret = (typeof obj === 'function') ? function () {
		if (opts.excludeMain) {
			return obj.apply(this, arguments);
		}

		return processFn(obj, P, opts).apply(this, arguments);
	} : {};

	return Object.keys(obj).reduce(function (ret, key) {
		var x = obj[key];
		ret[key] = (typeof x === 'function') && filter(key) ? processFn(x, P, opts) : x;
		return ret;
	}, ret);
};

pify.all = pify;
