'use strict';

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
	var ret = {};

	Object.keys(obj).forEach(function (key) {
		var x = obj[key];
		ret[key] = typeof x === 'function' ? pify(x, P, opts) : x;
	});

	return ret;
};
