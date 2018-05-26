import util from 'util';
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

function FixtureGrandparent() {}
FixtureGrandparent.prototype.grandparentMethod1 = fixture;
FixtureGrandparent.prototype.overriddenMethod1 = fixture;
function FixtureParent() {}
util.inherits(FixtureParent, FixtureGrandparent);
FixtureParent.prototype.parentMethod1 = fixture;
FixtureParent.prototype.overriddenMethod1 = fixture2;
FixtureParent.prototype.overriddenValue1 = 2;
function FixtureClass() {
	this.instanceMethod1 = fixture;
	this.instanceValue1 = 72;
}
util.inherits(FixtureClass, FixtureParent);
FixtureClass.prototype.method1 = fixture;
FixtureParent.prototype.overriddenValue1 = 4;
FixtureClass.prototype.value1 = 'neo';

test('main', async t => {
	t.is(typeof m(fixture)().then, 'function');
	t.is(await m(fixture)(), 'unicorn');
});

test('throw error on invalid input', t => {
	let error = t.throws(() => m());
	t.is(error.message, 'Expected `input` to be a `Function` or `Object`, got `undefined`');

	error = t.throws(() => m(''));
	t.is(error.message, 'Expected `input` to be a `Function` or `Object`, got `string`');

	error = t.throws(() => m(null));
	t.is(error.message, 'Expected `input` to be a `Function` or `Object`, got `null`');
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

test('result is AsyncFunction', t => {
	t.is(m(fs.readFile).constructor.name, 'AsyncFunction');
});

test('wrap twice still works', async t => {
	t.is(JSON.parse(await m(m(fs.readFile))('package.json')).name, 'pify');
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
	t.not(typeof pModule(() => {}).then, 'AsyncFunction');
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

test('class support - creates a copy', async t => {
	const obj = {
		x: 'foo',
		y(cb) {
			setImmediate(() => {
				cb(null, this.x);
			});
		}
	};

	const pified = m(obj, {bind: false});
	obj.x = 'bar';

	t.is(await pified.y(), 'foo');
	t.is(pified.x, 'foo');
});

test('class support — transforms inherited methods', t => {
	const instance = new FixtureClass();
	const pInstance = m(instance);

	const flattened = {};
	for (let prot = instance; prot; prot = Object.getPrototypeOf(prot)) {
		Object.assign(flattened, prot);
	}

	const keys = Object.keys(flattened);
	keys.sort();
	const pKeys = Object.keys(pInstance);
	pKeys.sort();
	t.deepEqual(keys, pKeys);

	t.is(instance.value1, pInstance.value1);
	t.is(typeof pInstance.instanceMethod1().then, 'function');
	t.is(typeof pInstance.method1().then, 'function');
	t.is(typeof pInstance.parentMethod1().then, 'function');
	t.is(typeof pInstance.grandparentMethod1().then, 'function');
});

test('class support — preserves prototype', t => {
	const instance = new FixtureClass();
	const pInstance = m(instance);

	t.true(pInstance instanceof FixtureClass);
});

test('class support — respects inheritance order', async t => {
	const instance = new FixtureClass();
	const pInstance = m(instance);

	t.is(instance.overriddenValue1, pInstance.overriddenValue1);
	t.is(await pInstance.overriddenMethod1('rainbow'), 'rainbow');
});

test('class support - transforms only members in options.include, copies all', t => {
	const instance = new FixtureClass();
	const pInstance = m(instance, {
		include: ['parentMethod1']
	});

	const flattened = {};
	for (let prot = instance; prot; prot = Object.getPrototypeOf(prot)) {
		Object.assign(flattened, prot);
	}

	const keys = Object.keys(flattened);
	keys.sort();
	const pKeys = Object.keys(pInstance);
	pKeys.sort();
	t.deepEqual(keys, pKeys);

	t.is(typeof pInstance.parentMethod1().then, 'function');
	t.not(typeof pInstance.method1(() => {}).then, 'function');
	t.not(typeof pInstance.grandparentMethod1(() => {}).then, 'function');
});

test('class support - doesn\'t transform members in options.exclude', t => {
	const instance = new FixtureClass();
	const pInstance = m(instance, {
		exclude: ['grandparentMethod1']
	});

	t.not(typeof pInstance.grandparentMethod1(() => {}).then, 'function');
	t.is(typeof pInstance.parentMethod1().then, 'function');
});

test('class support - options.include over options.exclude', t => {
	const instance = new FixtureClass();
	const pInstance = m(instance, {
		include: ['method1', 'parentMethod1'],
		exclude: ['parentMethod1', 'grandparentMethod1']
	});

	t.is(typeof pInstance.method1().then, 'function');
	t.is(typeof pInstance.parentMethod1().then, 'function');
	t.not(typeof pInstance.grandparentMethod1(() => {}).then, 'function');
});

