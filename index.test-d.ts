import {expectError, expectType, printType} from 'tsd';
import pify from '.';

expectError(pify());
expectError(pify(null));
expectError(pify(undefined));
expectError(pify(123));
expectError(pify('abc'));
expectError(pify(null, {}));
expectError(pify(undefined, {}));
expectError(pify(123, {}));
expectError(pify('abc', {}));

// eslint-disable-next-line @typescript-eslint/no-empty-function
expectType<Promise<unknown>>(pify((v: number) => {})());
expectType<Promise<unknown>>(pify(() => 'hello')());

// Callback with 1 additional params
declare function fn1(x: number, fn: (error: Error, value: number) => void): void;
expectType<Promise<number>>(pify(fn1)(1));

// Callback with 2 additional params
declare function fn2(x: number, y: number, fn: (error: Error, value: number) => void): void;
expectType<Promise<number>>(pify(fn2)(1, 2));

// Generics

declare function generic<T>(value: T, fn: (error: Error, value: T) => void): void;
declare const genericValue: 'hello' | 'goodbye';
expectType<Promise<typeof genericValue>>(pify(generic)(genericValue));

declare function generic10<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
	value1: T1,
	value2: T2,
	value3: T3,
	value4: T4,
	value5: T5,
	value6: T6,
	value7: T7,
	value8: T8,
	value9: T9,
	value10: T10,
	cb: (error: Error, value: {
		val1: T1;
		val2: T2;
		val3: T3;
		val4: T4;
		val5: T5;
		val6: T6;
		val7: T7;
		val8: T8;
		val9: T9;
		val10: T10;
	}) => void
): void;
expectType<
Promise<{
	val1: 1;
	val2: 2;
	val3: 3;
	val4: 4;
	val5: 5;
	val6: 6;
	val7: 7;
	val8: '8';
	val9: 9;
	val10: 10;
}>
>(pify(generic10)(1, 2, 3, 4, 5, 6, 7, '8', 9, 10));

// MultiArgs
declare function callback02(cb: (x: number, y: string) => void): void;
declare function callback12(value: 'a', cb: (x: number, y: string) => void): void;
declare function callback22(
	value1: 'a',
	value2: 'b',
	cb: (x: number, y: string) => void
): void;

expectType<Promise<[number, string]>>(pify(callback02, {multiArgs: true})());
expectType<Promise<[number, string]>>(
	pify(callback12, {multiArgs: true})('a'),
);
expectType<Promise<[number, string]>>(
	pify(callback22, {multiArgs: true})('a', 'b'),
);

// Overloads
declare function overloaded(value: number, cb: (error: Error, value: number) => void): void;
declare function overloaded(value: string, cb: (error: Error, value: string) => void): void;

// Chooses last overload
// See https://github.com/microsoft/TypeScript/issues/32164
expectType<Promise<string>>(pify(overloaded)(''));

declare const fixtureModule: {
	method1: (arg: string, cb: (error: Error, value: string) => void) => void;
	method2: (arg: number, cb: (error: Error, value: number) => void) => void;
	method3: (arg: string) => string;
	methodSync: (arg: 'sync') => 'sync';
	methodStream: (arg: 'stream') => 'stream';
	callbackEndingInSync: (arg: 'sync', cb: (error: Error, value: 'sync') => void) => void;
	prop: number;
};

// Module support
expectType<number>(pify(fixtureModule).prop);
expectType<Promise<string>>(pify(fixtureModule).method1(''));
expectType<Promise<number>>(pify(fixtureModule).method2(0));
// Same semantics as pify(fn)
expectType<Promise<unknown>>(pify(fixtureModule).method3());

// Excludes
expectType<
(arg: string, cb: (error: Error, value: string) => void) => void
>(pify(fixtureModule, {exclude: ['method1']}).method1);

// Includes
expectType<Promise<string>>(pify(fixtureModule, {include: ['method1']}).method1(''));
expectType<Promise<number>>(pify(fixtureModule, {include: ['method2']}).method2(0));

// Excludes sync and stream method by default
expectType<
(arg: 'sync') => 'sync'
>(pify(fixtureModule, {exclude: ['method1']}).methodSync);
expectType<
(arg: 'stream') => 'stream'
>(pify(fixtureModule, {exclude: ['method1']}).methodStream);

// Include sync method
expectType<
(arg: 'sync') => Promise<'sync'>
>(pify(fixtureModule, {include: ['callbackEndingInSync']}).callbackEndingInSync);

// Option errorFirst:

declare function fn0(fn: (value: number) => void): void;

// Unknown as it returns a promise that always rejects because errorFirst = true
expectType<Promise<unknown>>(pify(fn0)());
expectType<Promise<unknown>>(pify(fn0, {errorFirst: true})());

expectType<Promise<number>>(pify(fn0, {errorFirst: false})());
expectType<Promise<[number, string]>>(pify(callback02, {multiArgs: true, errorFirst: true})());
expectType<Promise<[number, string]>>(
	pify(callback12, {multiArgs: true, errorFirst: false})('a'),
);
expectType<Promise<[number, string]>>(
	pify(callback22, {multiArgs: true, errorFirst: false})('a', 'b'),
);

// Module function

// eslint-disable-next-line @typescript-eslint/no-empty-function
function moduleFunction(_cb: (error: Error, value: number) => void): void {}
// eslint-disable-next-line @typescript-eslint/no-empty-function
moduleFunction.method = function (_cb: (error: Error, value: string) => void): void {};

expectType<Promise<number>>(pify(moduleFunction)());

expectType<Promise<string>>(pify(moduleFunction, {excludeMain: true}).method());

// Classes

declare class MyClass {
	method1(cb: (error: Error, value: string) => void): void;
	method2(arg: number, cb: (error: Error, value: number) => void): void;
}

expectType<Promise<string>>(pify(new MyClass()).method1());
expectType<Promise<number>>(pify(new MyClass()).method2(4));
