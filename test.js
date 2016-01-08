import fs from 'fs';
import util from 'util';
import test from 'ava';
import pinkiePromise from 'pinkie-promise';
import fn from './';

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
	t.is(typeof fn(fixture)().then, 'function');
	t.is(await fn(fixture)(), 'unicorn');
});

test('pass argument', async t => {
	t.is(await fn(fixture2)('rainbow'), 'rainbow');
});

test('custom Promise module', async t => {
	t.is(await fn(fixture, {promiseModule: pinkiePromise})(), 'unicorn');
});

test('multiArgs option', async t => {
	t.deepEqual(await fn(fixture3, {multiArgs: true})(), ['unicorn', 'rainbow']);
});

test('wrap core method', async t => {
	t.is(JSON.parse(await fn(fs.readFile)('package.json')).name, 'pify');
});

test('module support', async t => {
	t.is(JSON.parse(await fn(fs).readFile('package.json')).name, 'pify');
});

test('module support - doesn\'t transform *Sync methods by default', t => {
	t.is(JSON.parse(fn(fs).readFileSync('package.json')).name, 'pify');
});

test('module support - preserves non-function members', t => {
	const module = {
		method: () => {},
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
	t.not(typeof pModule(() => {}).then, 'function');
});

test('class support — works for class instances', t => {
	const instance = new FixtureClass();
	const pInstance = fn(instance);

	t.deepEqual(Object.keys(instance), Object.keys(pInstance));
	t.is(typeof pInstance.instanceMethod1().then, 'function');
});

test('class support — options.inherited transforms inherited methods', t => {
	const instance = new FixtureClass();
	const pInstance = fn(instance, {
		inherited: true
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

	t.is(instance.value1, pInstance.value1);
	t.is(typeof pInstance.instanceMethod1().then, 'function');
	t.is(typeof pInstance.method1().then, 'function');
	t.is(typeof pInstance.parentMethod1().then, 'function');
	t.is(typeof pInstance.grandparentMethod1().then, 'function');
});

test('class support — preserves prototype', t => {
	const instance = new FixtureClass();
	const pInstance = fn(instance, {
		inherited: true
	});

	t.true(pInstance instanceof FixtureClass);
});

test('class support — respects inheritance order', async t => {
	const instance = new FixtureClass();
	const pInstance = fn(instance, {
		inherited: true
	});

	t.is(instance.overriddenValue1, pInstance.overriddenValue1);
	t.is(await pInstance.overriddenMethod1('rainbow'), 'rainbow');
});

test('class support - transforms only members in options.include, copies all', t => {
	const instance = new FixtureClass();
	const pInstance = fn(instance, {
		include: ['parentMethod1'],
		inherited: true
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
	const pInstance = fn(instance, {
		exclude: ['grandparentMethod1'],
		inherited: true
	});

	t.not(typeof pInstance.grandparentMethod1(() => {}).then, 'function');
	t.is(typeof pInstance.parentMethod1().then, 'function');
});

test('class support - options.include over options.exclude', t => {
	const instance = new FixtureClass();
	const pInstance = fn(instance, {
		include: ['method1', 'parentMethod1'],
		exclude: ['parentMethod1', 'grandparentMethod1'],
		inherited: true
	});

	t.is(typeof pInstance.method1().then, 'function');
	t.is(typeof pInstance.parentMethod1().then, 'function');
	t.not(typeof pInstance.grandparentMethod1(() => {}).then, 'function');
});
