'use strict';

function isFn(fn) {
	return ({}).toString.call(fn) === '[object Function]';
}

var pify = module.exports = function (fn, P) {
	P = P || Promise;

	if (!isFn(fn)) {
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

pify.all = function (module, P) {
	var ret = {};

	for (var method in module) {
		if (({}).hasOwnProperty.call(module, method)) {
			var x = module[method];
			ret[method] = isFn(x) ? pify(x, P) : x;
		}
	}

	return ret;
};
