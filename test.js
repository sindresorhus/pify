import fs from 'fs';
import stream from 'stream';
import test from 'ava';
import pinkiePromise from 'pinkie-promise';
import m from '.';

const fixture = cb => setImmediate(() => cb(null, 'unicorn'));
const fixture1 = cb => setImmediate(() => cb('error', 'unicorn', 'rainbow'));
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
	t.is(typeof m(fixture)().then, 'function');
	t.is(await m(fixture)(), 'unicorn');
});

test('error', async t => {
	t.is(await m(fixture1)().catch(err => err), 'error');
});

test('pass argument', async t => {
	t.is(await m(fixture2)('rainbow'), 'rainbow');
});

test('custom Promise module', async t => {
	t.is(await m(fixture, {promiseModule: pinkiePromise})(), 'unicorn');
});

test('multiArgs option', async t => {
	t.deepEqual(await m(fixture3, {multiArgs: true})(), ['unicorn', 'rainbow']);
});

test('multiArgs option — rejection', async t => {
	t.deepEqual(await m(fixture1, {multiArgs: true})().catch(err => err), ['error', 'unicorn', 'rainbow']);
});

test('wrap core method', async t => {
	t.is(JSON.parse(await m(fs.readFile)('package.json')).name, 'pify');
});

test('module support', async t => {
	t.is(JSON.parse(await m(fs).readFile('package.json')).name, 'pify');
});

test('module support - doesn\'t transform *Sync methods by default', t => {
	t.is(JSON.parse(m(fs).readFileSync('package.json')).name, 'pify');
});

test('module support - doesn\'t transform *Stream methods by default', t => {
	t.true(m(fs).createReadStream('package.json') instanceof stream.Readable);
});

test('module support - preserves non-function members', t => {
	const module = {
		method: () => {},
		nonMethod: 3
	};

	t.deepEqual(Object.keys(module), Object.keys(m(module)));
});

test('module support - transforms only members in options.include', t => {
	const pModule = m(fixtureModule, {
		include: ['method1', 'method2']
	});

	t.is(typeof pModule.method1().then, 'function');
	t.is(typeof pModule.method2().then, 'function');
	t.not(typeof pModule.method3().then, 'function');
});

test('module support - doesn\'t transform members in options.exclude', t => {
	const pModule = m(fixtureModule, {
		exclude: ['method3']
	});

	t.is(typeof pModule.method1().then, 'function');
	t.is(typeof pModule.method2().then, 'function');
	t.not(typeof pModule.method3().then, 'function');
});

test('module support - options.include over options.exclude', t => {
	const pModule = m(fixtureModule, {
		include: ['method1', 'method2'],
		exclude: ['method2', 'method3']
	});

	t.is(typeof pModule.method1().then, 'function');
	t.is(typeof pModule.method2().then, 'function');
	t.not(typeof pModule.method3().then, 'function');
});

test('module support — function modules', t => {
	const pModule = m(fixture4);

	t.is(typeof pModule().then, 'function');
	t.is(typeof pModule.meow().then, 'function');
});

test('module support — function modules exclusion', t => {
	const pModule = m(fixture4, {
		excludeMain: true
	});

	t.is(typeof pModule.meow().then, 'function');
	t.not(typeof pModule(() => {}).then, 'function');
});

test('`errorFirst` option', async t => {
	const fixture = (foo, cb) => {
		cb(foo);
	};

	t.is(await m(fixture, {errorFirst: false})('🦄'), '🦄');
});

test('`errorFirst` option and `multiArgs`', async t => {
	const fixture = (foo, bar, cb) => {
		cb(foo, bar);
	};

	t.deepEqual(await m(fixture, {
		errorFirst: false,
		multiArgs: true
	})('🦄', '🌈'), ['🦄', '🌈']);
});
