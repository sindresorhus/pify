'use strict';
var fs = require('fs');
var test = require('ava');
var pinkiePromise = global.Promise = require('pinkie-promise');
var fn = require('./');

function fixture(cb) {
	setImmediate(function () {
		cb(null, 'unicorn');
	});
}

function fixture2(x, cb) {
	setImmediate(function () {
		cb(null, x);
	});
}

function fixture3(cb) {
	setImmediate(function () {
		cb(null, 'unicorn', 'rainbow');
	});
}

function fixture4() {
	return 'unicorn';
}

function fixture5(cb) {
	setImmediate(function () {
		cb(null, 'unicorn');
	});
	return true;
}

fixture5.meow = function (cb) {
	setImmediate(function () {
		cb(null, 'unicorn');
	});
};

test('main', function (t) {
	t.is(typeof fn(fixture)().then, 'function');

	return fn(fixture)().then(function (data) {
		t.is(data, 'unicorn');
	});
});

test('pass argument', function (t) {
	return fn(fixture2)('rainbow').then(function (data) {
		t.is(data, 'rainbow');
	});
});

test('custom Promise module', function (t) {
	return fn(fixture, pinkiePromise)().then(function (data) {
		t.is(data, 'unicorn');
	});
});

test('multiArgs option', function (t) {
	return fn(fixture3, {multiArgs: true})().then(function (data) {
		t.same(data, ['unicorn', 'rainbow']);
	});
});

test('wrap core method', function (t) {
	return fn(fs.readFile)('package.json').then(function (data) {
		t.is(JSON.parse(data).name, 'pify');
	});
});

test('module support', function (t) {
	return fn.all(fs).readFile('package.json').then(function (data) {
		t.is(JSON.parse(data).name, 'pify');
	});
});

test('module support - preserves non-function members', function (t) {
	var module = {
		method: function () {},
		nonMethod: 3
	};

	t.same(Object.keys(module), Object.keys(fn.all(module)));
	t.end();
});

test('module support - transforms only members in opions.include', function (t) {
	var module = {
		method1: fixture,
		method2: fixture2,
		method3: fixture4
	};

	var pModule = fn.all(module, {
		include: ['method*', '!method3']
	});

	t.is(typeof pModule.method1().then, 'function');
	t.is(typeof pModule.method2('fainbow').then, 'function');
	t.not(typeof pModule.method3().then, 'function');
	t.end();
});

test('module support - doesn\'t transform members in opions.exclude', function (t) {
	var module = {
		method1: fixture4,
		method2: fixture4,
		method3: fixture
	};

	var pModule = fn.all(module, {
		exclude: ['method1', 'method2']
	});

	t.not(typeof pModule.method1().then, 'function');
	t.not(typeof pModule.method2().then, 'function');
	t.is(typeof pModule.method3().then, 'function');
	t.end();
});

test('module support - options.include over opions.exclude', function (t) {
	var module = {
		method1: fixture,
		method2: fixture2,
		method3: fixture4
	};

	var pModule = fn.all(module, {
		include: ['method1', 'method2'],
		exclude: ['method2', 'method3']
	});

	t.is(typeof pModule.method1().then, 'function');
	t.is(typeof pModule.method2('rainbow').then, 'function');
	t.not(typeof pModule.method3().then, 'function');
	t.end();
});

test('module support — function modules', function (t) {
	var pModule = fn.all(fixture5);

	t.is(typeof pModule().then, 'function');
	t.is(typeof pModule.meow().then, 'function');
	t.end();
});

test('module support — function modules exclusion', function (t) {
	var pModule = fn.all(fixture5, {
		excludeMain: true
	});

	t.is(typeof pModule.meow().then, 'function');
	t.not(typeof pModule(function () {}).then, 'function');
	t.end();
});

test('module support – glob exclusion', function (t) {
	t.is(typeof fn.all(fs, {include: '!*Sync'}).readFileSync('package.json', 'utf8'), 'string');
	t.end();
});
