'use strict';
var fs = require('fs');
var test = require('ava');
var pinkiePromise = require('pinkie-promise');
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

test('return array when more than two arguments in callback', function (t) {
	return fn(fixture3)().then(function (data) {
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

test('module support preserves non-function members', function (t) {
	t.plan(1);

	var module = {
		method: function () {},
		nonMethod: 3
	};

	var expectedKeys = Object.keys(module);
	var actualKeys = Object.keys(fn.all(module));

	t.same(expectedKeys, actualKeys);
});
