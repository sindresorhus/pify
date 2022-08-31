import { expectError, expectType, printType } from "tsd";
import pify = require(".");

expectError(pify());
expectError(pify(null));
expectError(pify(undefined));
expectError(pify(123));
expectError(pify("abc"));
expectError(pify(null, {}));
expectError(pify(undefined, {}));
expectError(pify(123, {}));
expectError(pify("abc", {}));

expectType<never>(pify((v: number) => {})());
// TODO: Figure out a way for this to return `never`
expectType<Promise<never>>(pify(() => 'hello')());

// callback with 0 additional params
declare function fn0(fn: (val: number) => void): void;
expectType<Promise<number>>(pify(fn0)());

// callback with 1 additional params
declare function fn1(x: number, fn: (val: number) => void): void;
expectType<Promise<number>>(pify(fn1)(1));

// callback with 2 additional params
declare function fn2(x: number, y: number, fn: (val: number) => void): void;
expectType<Promise<number>>(pify(fn2)(1, 2));

// generics

declare function generic<T>(val: T, fn: (val: T) => void): void;
declare const genericVal: "hello" | "goodbye";
expectType<Promise<typeof genericVal>>(pify(generic)(genericVal));

declare function generic10<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
	val1: T1,
	val2: T2,
	val3: T3,
	val4: T4,
	val5: T5,
	val6: T6,
	val7: T7,
	val8: T8,
	val9: T9,
	val10: T10,
	cb: (value: {
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
		val8: "8";
		val9: 9;
		val10: 10;
	}>
>(pify(generic10)(1, 2, 3, 4, 5, 6, 7, "8", 9, 10));

// multiArgs
declare function callback02(cb: (x: number, y: string) => void): void;
declare function callback12(val: "a", cb: (x: number, y: string) => void): void;
declare function callback22(
	val1: "a",
	val2: "b",
	cb: (x: number, y: string) => void
): void;

expectType<Promise<[number, string]>>(pify(callback02, { multiArgs: true })());
expectType<Promise<[number, string]>>(
	pify(callback12, { multiArgs: true })("a")
);
expectType<Promise<[number, string]>>(
	pify(callback22, { multiArgs: true })("a", "b")
);

// overloads
declare function overloaded(value: number, cb: (value: number) => void): void;
declare function overloaded(value: string, cb: (value: string) => void): void;

// Chooses last overload
// See https://github.com/microsoft/TypeScript/issues/32164
expectType<Promise<string>>(pify(overloaded)(""));

declare const fixtureModule: {
	method1: (arg: string, cb: (error: Error, value: string) => void) => void;
	method2: (arg: number, cb: (error: Error, value: number) => void) => void;
	method3: (arg: string) => string
	prop: number;
}

// module support
expectType<number>(pify(fixtureModule).prop);
expectType<Promise<string>>(pify(fixtureModule).method1(""));
expectType<Promise<number>>(pify(fixtureModule).method2(0));
// Same semantics as pify(fn)
expectType<never>(pify(fixtureModule).method3());

// excludes
expectType<
	(arg: string, cb: (error: Error, value: string) => void) => void
>(pify(fixtureModule, { exclude: ['method1'] }).method1);
