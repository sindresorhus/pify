'use strict';

var pify = module.exports = function (fn, P) {
	P = P || Promise;

	if (typeof fn !== 'function') {
		throw new TypeError('Expected a function');
	}

	return function () {
		var that = this;
		var args = [].slice.call(arguments);

		return new P(function (resolve, reject) {
			args.push(function (err, result) {
				if (err) {
					reject(err);
				} else if (arguments.length > 2) {
					resolve([].slice.call(arguments, 1));
				} else {
					resolve(result);
				}
			});

			fn.apply(that, args);
		});
	};
};

pify.all = function (obj, P) {
	var ret = {};

	Object.keys(obj).forEach(function (key) {
		var x = obj[key];
		ret[key] = typeof x === 'function' ? pify(x, P) : x;
	});

	return ret;
};
