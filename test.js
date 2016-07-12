import fs from 'fs';
import test from 'ava';
import pinkiePromise from 'pinkie-promise';
import fn from './';

global.Promise = pinkiePromise;

const fixture = cb => setImmediate(() => cb(null, 'unicorn'));
const fixture2 = (x, cb) => setImmediate(() => cb(null, x));
const fixture3 = cb => setImmediate(() => cb(null, 'unicorn', 'rainbow'));
const fixture4 = cb => setImmediate(() => {
	cb(null, 'unicorn');
	return 'rainbow';
});

fixture4.meow = cb => {
	setImmediate(() => {
		cb(null, 'unicorn');
	});
};

const fixture5 = () => 'rainbow';

const fixtureModule = {
	method1: fixture,
	method2: fixture,
	method3: fixture5
};

test('main', async t => {
	t.is(typeof fn(fixture)().then, 'function');
	t.is(await fn(fixture)(), 'unicorn');
});

test('pass argument', async t => {
	t.is(await fn(fixture2)('rainbow'), 'rainbow');
});

test('custom Promise module', async t => {
	t.is(await fn(fixture, pinkiePromise)(), 'unicorn');
});

test('multiArgs option', async t => {
	t.deepEqual(await fn(fixture3, {multiArgs: true})(), ['unicorn', 'rainbow']);
});

test('wrap core method', async t => {
	t.is(JSON.parse(await fn(fs.readFile)('package.json')).name, 'pify');
});

test('binds to the original object by default', async t => {
	const obj = {
		x: 'foo',
		y: function (cb) {
			setImmediate(() => cb(null, this.x));
		}
	};

	const pified = fn(obj);
	obj.x = 'bar';

	t.is(await pified.y(), 'bar');
	t.is(pified.x, 'bar');
});

test('bind:true will bind to the original object', async t => {
	const obj = {
		x: 'foo',
		y: function (cb) {
			setImmediate(() => cb(null, this.x));
		}
	};

	const pified = fn(obj, {bind: true});
	obj.x = 'bar';

	t.is(await pified.y(), 'bar');
	t.is(pified.x, 'bar');
});

test('bind:otherObj will bind to otherObj', async t => {
	const obj = {
		x: 'foo',
		y: function (cb) {
			setImmediate(() => cb(null, this.x));
		}
	};

	const otherObj = {
		x: 'baz'
	};

	const pified = fn(obj, {bind: otherObj});

	t.is(await pified.y(), 'baz');
});

test('bind:false creates a copy', async t => {
	const obj = {
		x: 'foo',
		y: function (cb) {
			setImmediate(() => cb(null, this.x));
		}
	};

	const pified = fn(obj, {bind: false});

	obj.x = 'bar';

	t.is(await pified.y(), 'foo');
	t.is(pified.x, 'foo');
});

test('module support', async t => {
	t.is(JSON.parse(await fn(fs).readFile('package.json')).name, 'pify');
});

test('module support - doesn\'t transform *Sync methods by default', t => {
	t.is(JSON.parse(fn(fs).readFileSync('package.json')).name, 'pify');
});

test('module support - preserves non-function members', t => {
	const module = {
		method: function () {},
		nonMethod: 3
	};

	t.deepEqual(Object.keys(module), Object.keys(fn(module)));
});

test('module support - transforms only members in options.include', t => {
	const pModule = fn(fixtureModule, {
		include: ['method1', 'method2']
	});

	t.is(typeof pModule.method1().then, 'function');
	t.is(typeof pModule.method2().then, 'function');
	t.not(typeof pModule.method3().then, 'function');
});

test('module support - doesn\'t transform members in options.exclude', t => {
	const pModule = fn(fixtureModule, {
		exclude: ['method3']
	});

	t.is(typeof pModule.method1().then, 'function');
	t.is(typeof pModule.method2().then, 'function');
	t.not(typeof pModule.method3().then, 'function');
});

test('module support - options.include over options.exclude', t => {
	const pModule = fn(fixtureModule, {
		include: ['method1', 'method2'],
		exclude: ['method2', 'method3']
	});

	t.is(typeof pModule.method1().then, 'function');
	t.is(typeof pModule.method2().then, 'function');
	t.not(typeof pModule.method3().then, 'function');
});

test('module support — function modules', t => {
	const pModule = fn(fixture4);

	t.is(typeof pModule().then, 'function');
	t.is(typeof pModule.meow().then, 'function');
});

test('module support — function modules exclusion', t => {
	const pModule = fn(fixture4, {
		excludeMain: true
	});

	t.is(typeof pModule.meow().then, 'function');
	t.not(typeof pModule(function () {}).then, 'function');
});
