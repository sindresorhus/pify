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

function fixture4(cb) {
	setImmediate(function () {
		cb(null, 'unicorn');
	});
	return 'rainbow';
}

fixture4.meow = function (cb) {
	setImmediate(function () {
		cb(null, 'unicorn');
	});
};

function fixture5() {
	return 'rainbow';
}

var fixtureModule = {
	method1: fixture,
	method2: fixture,
	method3: fixture5
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
	return fn(fs).readFile('package.json').then(function (data) {
		t.is(JSON.parse(data).name, 'pify');
	});
});

test('module support - doesn\'t transform *Sync methods by default', function (t) {
	var data = fn(fs).readFileSync('package.json');
	t.is(JSON.parse(data).name, 'pify');
	t.end();
});

test('module support - preserves non-function members', function (t) {
	var module = {
		method: function () {},
		nonMethod: 3
	};

	t.same(Object.keys(module), Object.keys(fn(module)));
	t.end();
});

test('module support - transforms only members in opions.include', function (t) {
	var pModule = fn(fixtureModule, {
		include: ['method1', 'method2']
	});

	t.is(typeof pModule.method1().then, 'function');
	t.is(typeof pModule.method2().then, 'function');
	t.not(typeof pModule.method3().then, 'function');
	t.end();
});

test('module support - doesn\'t transform members in opions.exclude', function (t) {
	var pModule = fn(fixtureModule, {
		exclude: ['method3']
	});

	t.is(typeof pModule.method1().then, 'function');
	t.is(typeof pModule.method2().then, 'function');
	t.not(typeof pModule.method3().then, 'function');
	t.end();
});

test('module support - options.include over opions.exclude', function (t) {
	var pModule = fn(fixtureModule, {
		include: ['method1', 'method2'],
		exclude: ['method2', 'method3']
	});

	t.is(typeof pModule.method1().then, 'function');
	t.is(typeof pModule.method2().then, 'function');
	t.not(typeof pModule.method3().then, 'function');
	t.end();
});

test('module support — function modules', function (t) {
	var pModule = fn(fixture4);

	t.is(typeof pModule().then, 'function');
	t.is(typeof pModule.meow().then, 'function');
	t.end();
});

test('module support — function modules exclusion', function (t) {
	var pModule = fn(fixture4, {
		excludeMain: true
	});

	t.is(typeof pModule.meow().then, 'function');
	t.not(typeof pModule(function () {}).then, 'function');
	t.end();
});
