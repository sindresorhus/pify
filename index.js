'use strict';
var minimatch = require('minimatch');

var pify = module.exports = function (fn, P, opts) {
	if (typeof P !== 'function') {
		opts = P;
		P = Promise;
	}

	opts = opts || {};

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

pify.all = function (obj, P, opts) {
	if (typeof P !== 'function') {
		opts = P;
		P = Promise;
	}

	opts = opts || {};

	if (opts.exclude && !opts.include) {
		opts.include = opts.exclude.map(function (glob) {
			return '!' + glob;
		});
	}

	var filter = function (key) {
		var negate = false;
		var flag = false;

		if (opts.include) {
			[].concat(opts.include).forEach(function (glob) {
				negate = ((glob[0] === '!') && minimatch(key, glob.slice(1))) || negate;
				flag = minimatch(key, glob) || flag;
			});

			return flag && !negate;
		}

		return true;
	};

	var ret = (typeof obj === 'function') ? function () {
		if (opts.excludeMain) {
			return obj.apply(this, arguments);
		}

		return pify(obj, P, opts).apply(this, arguments);
	} : {};

	return Object.keys(obj).reduce(function (ret, key) {
		var x = obj[key];
		ret[key] = (typeof x === 'function') && filter(key) ? pify(x, P, opts) : x;
		return ret;
	}, ret);
};
