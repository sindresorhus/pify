'use strict';
module.exports = function (fn, P) {
	P = P || Promise;

	if (({}).toString.call(fn) !== '[object Function]') {
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
