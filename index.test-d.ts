import {expectType, expectNotType, expectError, expectAssignable, printType} from 'tsd';
import pify = require('.');

expectError(pify());
expectError(pify(null));
expectError(pify(undefined));
expectError(pify(123));
expectError(pify('abc'));
expectError(pify(null, {}));
expectError(pify(undefined, {}));
expectError(pify(123, {}));
expectError(pify('abc', {}));
expectError(pify((v: number) => {})());

type A1 = 'A1';
type A2 = 'A2';
type R1 = 'R1';
type R2 = 'R2';
let someBoolean:boolean = Math.random() > 0.5;
const a1:A1 = 'A1';
const a2:A2 = 'A2';

let function00 = (cb: (err: Error | undefined) => any) => { };
let function10 = (a1:A1, cb: (err: Error | undefined) => any) => { };
let function20 = (a1:A1, a2:A2, cb: (err: Error | undefined) => any) => { };

let function01 = (cb: (err: Error | undefined, v1?:R1) => any) => { };
let function11 = (a1:A1, cb: (err: Error | undefined, v1?:R1) => any) => { };
let function21 = (a1:A1, a2:A2, cb: (err: Error | undefined, v1?:R1) => any) => { };

let function02 = (cb: (err: Error | undefined, v1?:R1, v2?:R2) => any) => { };
let function12 = (a1:A1, cb: (err: Error | undefined, v1?:R1, v2?:R2) => any) => { };
let function22 = (a1:A1, a2:A2, cb: (err: Error | undefined, v1?:R1, v2?:R2) => any) => { };

let functionNoError00 = (cb: () => any) => { };
let functionNoError10 = (a1:A1, cb: () => any) => { };
let functionNoError01 = (cb: (v1:R1) => any) => { };
let functionNoError11 = (a1:A1, cb: (v1:R1) => any) => { };

expectType<() => Promise<void>>(pify(functionNoError00, {errorFirst: false}));
expectType<() => Promise<R1>>(pify(functionNoError01, {errorFirst: false}));
expectType<(a1:A1) => Promise<void>>(pify(functionNoError10, {errorFirst: false}));
expectType<(a1:A1) => Promise<R1>>(pify(functionNoError11, {errorFirst: false}));

expectType<{}>(pify({}));
expectAssignable<{a: number, b: boolean, c: string}>(pify({a: 1, b: true, c: 'qwe'}));
expectType<{a: number, b: boolean, c: string}>(pify({a: 1, b: someBoolean, c: 'qwe'}));

expectType<() => Promise<void>>(pify(function00));
expectType<(a1:A1) => Promise<void>>(pify(function10));
expectType<(a1:A1, a2:A2) => Promise<void>>(pify(function20));

expectType<() => Promise<void>>(pify(function00, {excludeMain: false}));
expectType<(a1:A1) => Promise<void>>(pify(function10, {excludeMain: false}));
expectType<(a1:A1, a2:A2) => Promise<void>>(pify(function20, {excludeMain: false}));

expectType<() => Promise<void>>(pify(function00, {errorFirst: true}));
expectType<(a1:A1) => Promise<void>>(pify(function10, {errorFirst: true}));
expectType<(a1:A1, a2:A2) => Promise<void>>(pify(function20, {errorFirst: true}));

expectType<() => Promise<Error | undefined>>(pify(function00, {errorFirst: false}));
expectType<(a1:A1) => Promise<Error | undefined>>(pify(function10, {errorFirst: false}));
expectType<(a1:A1, a2:A2) => Promise<Error | undefined>>(pify(function20, {errorFirst: false}));

expectType<() => Promise<void>>(pify(function00, {errorFirst: true}));
expectType<(a1:A1) => Promise<void>>(pify(function10, {errorFirst: true}));
expectType<(a1:A1, a2:A2) => Promise<void>>(pify(function20, {errorFirst: true}));

expectType<() => Promise<[Error | undefined]>>(pify(function00, {errorFirst: false, multiArgs: true}));
expectType<(a1:A1) => Promise<[Error | undefined]>>(pify(function10, {errorFirst: false, multiArgs: true}));
expectType<(a1:A1, a2:A2) => Promise<[Error | undefined]>>(pify(function20, {errorFirst: false, multiArgs: true}));

expectType<typeof function00>(pify(function00, {excludeMain: true}));
expectType<typeof function10>(pify(function10, {excludeMain: true}));
expectType<typeof function20>(pify(function20, {excludeMain: true}));
expectType<typeof function01>(pify(function01, {excludeMain: true}));
expectType<typeof function11>(pify(function11, {excludeMain: true}));
expectType<typeof function21>(pify(function21, {excludeMain: true}));
expectType<typeof function02>(pify(function02, {excludeMain: true}));
expectType<typeof function12>(pify(function12, {excludeMain: true}));
expectType<typeof function22>(pify(function22, {excludeMain: true}));

expectAssignable<Function>(pify(function00, {excludeMain: someBoolean}));
expectAssignable<Function>(pify(function01, {excludeMain: someBoolean}));
expectAssignable<Function>(pify(function02, {excludeMain: someBoolean}));
expectAssignable<Function>(pify(function10, {excludeMain: someBoolean}));
expectAssignable<Function>(pify(function11, {excludeMain: someBoolean}));
expectAssignable<Function>(pify(function12, {excludeMain: someBoolean}));
expectAssignable<Function>(pify(function20, {excludeMain: someBoolean}));
expectAssignable<Function>(pify(function21, {excludeMain: someBoolean}));
expectAssignable<Function>(pify(function22, {excludeMain: someBoolean}));

expectType<{
	function: () => Promise<void>,
	number: number,
}>(pify({
	function: function00,
	number: 123,
}));

expectAssignable<{
	function: () => Promise<void>,
	number: number,
	string?: string,
}>(pify({
	function: function00,
	number: 1,
}));

expectNotType<{
	function: () => Promise<void>,
	string: string,
	number: number,
}>(pify({
	function: function00,
	string: 'qwe',
}));

declare function generic10<A0>(a0:A0, cb:(error: Error | null | undefined) => any): any;
declare function generic01<R0>(cb:(error:  Error | null | undefined, r0:R0) => any): any;
declare function generic11<A0, R0>(a0:A0, cb:(error:  Error | null | undefined, r0:R0) => any): any;

expectType<Promise<A1>>((pify(generic01))<A1>());
expectType<Promise<void>>((pify(generic10))<A1>(a1));
expectType<Promise<A2>>((pify(generic11))<A1, A2>(a1));

declare function realLifeFunction1(url: string, callback: (error?: Error | null | undefined, response?: { statusCode: number }, body?: string) => void): void;
expectType<(url: string) => Promise<[{ statusCode: number }?, string?]>>(pify(realLifeFunction1, { multiArgs: true }))
declare function realLifeFunction2(url: string, callback: (response?: { statusCode: number }, body?: string) => void): void;
expectType<(url: string) => Promise<[{ statusCode: number }?, string?]>>(pify(realLifeFunction2, { multiArgs: true, errorFirst: false }))

const fs = {
		readFile(path: string, callback: (error?: Error, data?: Buffer) => void): void {
				callback(undefined, Buffer.from('abc', 'utf8'));
		},
		exists(path: string, callback: (result: boolean) => void): void {
				callback(true);
		},
};

expectType<{
	readFile: (path: string) => Promise<Buffer | undefined>,
	exists: (path: string) => Promise<void>,
}>(pify(fs));

expectAssignable<{
	readFile: (path: string) => Promise<Buffer | undefined>,
}>(pify(fs, {exclude:['exists']}));

expectAssignable<{
	exists: (path: string) => Promise<boolean>,
}>(pify(fs, {exclude:['readFile'], errorFirst:false}));
