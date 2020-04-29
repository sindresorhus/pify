/* eslint-disable promise/prefer-await-to-then */
import util from 'util';
import fs from 'fs';
import stream from 'stream';
import test from 'ava';
import pinkiePromise from 'pinkie-promise';
import pify from '.';

const fixture = callback => setImmediate(() => {
	callback(null, 'unicorn');
});

const fixture1 = callback => setImmediate(() => {
	callback('error', 'unicorn', 'rainbow');
});

const fixture2 = (value, callback) => setImmediate(() => {
	callback(null, value);
});

const fixture3 = callback => setImmediate(() => {
	callback(null, 'unicorn', 'rainbow');
});

const fixture4 = callback => setImmediate(() => {
	callback(null, 'unicorn');
	return 'rainbow';
});

fixture4.meow = callback => {
	setImmediate(() => {
		callback(null, 'unicorn');
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
FixtureClass.prototype.method2Cb = function (callback) {
	setImmediate(() => {
		callback(null, this.instanceValue1);
	});
};

FixtureClass.prototype.method2Async = pify(FixtureClass.prototype.method2Cb);
FixtureParent.prototype.overriddenValue1 = 4;
FixtureClass.prototype.value1 = 'neo';

test('main', async t => {
	t.is(typeof pify(fixture)().then, 'function');
	t.is(await pify(fixture)(), 'unicorn');
});

test('throw error on invalid input', t => {
	let error = t.throws(() => pify());
	t.is(error.message, 'Expected `input` to be a `Function` or `Object`, got `undefined`');

	error = t.throws(() => pify(''));
	t.is(error.message, 'Expected `input` to be a `Function` or `Object`, got `string`');

	error = t.throws(() => pify(null));
	t.is(error.message, 'Expected `input` to be a `Function` or `Object`, got `null`');
});

test('error', async t => {
	t.is(await pify(fixture1)().catch(error => error), 'error');
});

test('pass argument', async t => {
	t.is(await pify(fixture2)('rainbow'), 'rainbow');
});

test('custom Promise module', async t => {
	t.is(await pify(fixture, {promiseModule: pinkiePromise})(), 'unicorn');
});

test('multiArgs option', async t => {
	t.deepEqual(await pify(fixture3, {multiArgs: true})(), ['unicorn', 'rainbow']);
});

test('multiArgs option — rejection', async t => {
	t.deepEqual(await pify(fixture1, {multiArgs: true})().catch(error => error), ['error', 'unicorn', 'rainbow']);
});

test('wrap core method', async t => {
	t.is(JSON.parse(await pify(fs.readFile)('package.json')).name, 'pify');
});

test('module support', async t => {
	t.is(JSON.parse(await pify(fs).readFile('package.json')).name, 'pify');
});

test('module support - doesn\'t transform *Sync methods by default', t => {
	t.is(JSON.parse(pify(fs).readFileSync('package.json')).name, 'pify');
});

test('module support - doesn\'t transform *Stream methods by default', t => {
	t.true(pify(fs).createReadStream('package.json') instanceof stream.Readable);
});

test('module support - preserves non-function members', t => {
	const module = {
		method: () => {},
		nonMethod: 3
	};

	t.deepEqual(Object.keys(module), Object.keys(pify(module)));
});

test('module support - transforms only members in options.include', t => {
	const pModule = pify(fixtureModule, {
		include: ['method1', 'method2']
	});

	t.is(typeof pModule.method1().then, 'function');
	t.is(typeof pModule.method2().then, 'function');
	t.not(typeof pModule.method3().then, 'function');
});

test('module support - doesn\'t transform members in options.exclude', t => {
	const pModule = pify(fixtureModule, {
		exclude: ['method3']
	});

	t.is(typeof pModule.method1().then, 'function');
	t.is(typeof pModule.method2().then, 'function');
	t.not(typeof pModule.method3().then, 'function');
});

test('module support - options.include over options.exclude', t => {
	const pModule = pify(fixtureModule, {
		include: ['method1', 'method2'],
		exclude: ['method2', 'method3']
	});

	t.is(typeof pModule.method1().then, 'function');
	t.is(typeof pModule.method2().then, 'function');
	t.not(typeof pModule.method3().then, 'function');
});

test('module support — function modules', t => {
	const pModule = pify(fixture4);

	t.is(typeof pModule().then, 'function');
	t.is(typeof pModule.meow().then, 'function');
});

test('module support — function modules exclusion', t => {
	const pModule = pify(fixture4, {
		excludeMain: true
	});

	t.is(typeof pModule.meow().then, 'function');
	t.not(typeof pModule(() => {}).then, 'function');
});

test('`errorFirst` option', async t => {
	const fixture = (foo, callback) => {
		callback(foo);
	};

	t.is(await pify(fixture, {errorFirst: false})('🦄'), '🦄');
});

test('`errorFirst` option and `multiArgs`', async t => {
	const fixture = (foo, bar, callback) => {
		callback(foo, bar);
	};

	t.deepEqual(await pify(fixture, {
		errorFirst: false,
		multiArgs: true
	})('🦄', '🌈'), ['🦄', '🌈']);
});

test('class support - does not create a copy', async t => {
	const obj = {
		x: 'foo',
		y(callback) {
			setImmediate(() => {
				callback(null, this.x);
			});
		}
	};

	const pified = pify(obj);
	obj.x = 'bar';

	t.is(await pified.y(), 'bar');
	t.is(pified.x, 'bar');
});

test('class support — transforms inherited methods', t => {
	const instance = new FixtureClass();
	const pInstance = pify(instance);

	t.is(instance.value1, pInstance.value1);
	t.is(typeof pInstance.instanceMethod1().then, 'function');
	t.is(typeof pInstance.method1().then, 'function');
	t.is(typeof pInstance.parentMethod1().then, 'function');
	t.is(typeof pInstance.grandparentMethod1().then, 'function');
});

test('class support — preserves prototype', t => {
	const instance = new FixtureClass();
	const pInstance = pify(instance);

	t.true(pInstance instanceof FixtureClass);
});

test('class support — respects inheritance order', async t => {
	const instance = new FixtureClass();
	const pInstance = pify(instance);

	t.is(instance.overriddenValue1, pInstance.overriddenValue1);
	t.is(await pInstance.overriddenMethod1('rainbow'), 'rainbow');
});

test('class support - transforms only members in options.include, copies all', t => {
	const instance = new FixtureClass();
	const pInstance = pify(instance, {
		include: ['parentMethod1']
	});

	t.is(typeof pInstance.parentMethod1().then, 'function');
	t.not(typeof pInstance.method1(() => {}).then, 'function');
	t.not(typeof pInstance.grandparentMethod1(() => {}).then, 'function');
});

test('class support - doesn\'t transform members in options.exclude', t => {
	const instance = new FixtureClass();
	const pInstance = pify(instance, {
		exclude: ['grandparentMethod1']
	});

	t.not(typeof pInstance.grandparentMethod1(() => {}).then, 'function');
	t.is(typeof pInstance.parentMethod1().then, 'function');
});

test('class support - options.include over options.exclude', t => {
	const instance = new FixtureClass();
	const pInstance = pify(instance, {
		include: ['method1', 'parentMethod1'],
		exclude: ['parentMethod1', 'grandparentMethod1']
	});

	t.is(typeof pInstance.method1().then, 'function');
	t.is(typeof pInstance.parentMethod1().then, 'function');
	t.not(typeof pInstance.grandparentMethod1(() => {}).then, 'function');
});

class TrueReflector {
	constructor() {
		this.value = true;
	}

	getTrue(callback) {
		callback(this.value);
	}
}

test('class support - allows function to access their context', async t => {
	const trueReflector = new TrueReflector();
	const pInstance = pify(trueReflector.getTrue);
	t.true(await pInstance());
});

test('promisify prototype function', async t => {
	const instance = new FixtureClass();
	t.is(await instance.method2Async(), 72);
});

test('method mutation', async t => {
	const object = {
		foo(callback) {
			setImmediate(() => {
				callback(null, 'original');
			});
		}
	};
	const pified = pify(object);

	object.foo = callback => setImmediate(() => {
		callback(null, 'new');
	});

	t.is(await pified.foo(), 'new');
});

test('symbol keys', async t => {
	await t.notThrowsAsync(async () => {
		const symbol = Symbol('symbol');

		const object = {
			[symbol]: callback => {
				setImmediate(callback);
			}
		};

		const pified = pify(object);
		await pified[symbol]();
	});
});

// [[Get]] for proxy objects enforces the following invariants: The value
// reported for a property must be the same as the value of the corresponding
// target object property if the target object property is a non-writable,
// non-configurable own data property.
test('non-writable non-configurable property', t => {
	const object = {};
	Object.defineProperty(object, 'prop', {
		value: callback => {
			setImmediate(callback);
		},
		writable: false,
		configurable: false
	});

	const pified = pify(object);
	t.notThrows(() => {
		Reflect.get(pified, 'prop');
	});
});

test('do not promisify Function.prototype.bind', async t => {
	function fn(callback) {
		callback(null, this);
	}

	const target = {};
	t.is(await pify(fn).bind(target)(), target);
});

test('do not break internal callback usage', async t => {
	const object = {
		foo(callback) {
			this.bar(4, callback);
		},
		bar(...arguments_) {
			const callback = arguments_.pop();
			callback(null, 42);
		}
	};
	t.is(await pify(object).foo(), 42);
});

test('Function.prototype.call', async t => {
	function fn(...arguments_) {
		const callback = arguments_.pop();
		callback(null, arguments_.length);
	}

	const pified = pify(fn);
	t.is(await pified.call(), 0);
});

test('Function.prototype.apply', async t => {
	function fn(...arguments_) {
		const callback = arguments_.pop();
		callback(null, arguments_.length);
	}

	const pified = pify(fn);
	t.is(await pified.apply(), 0);
});

test('self as member', async t => {
	function fn(...arguments_) {
		const callback = arguments_.pop();
		callback(null, arguments_.length);
	}

	fn.self = fn;
	const pified = pify(fn);
	t.is(await pified.self(), 0);
});
