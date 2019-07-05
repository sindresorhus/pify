import { expectType } from 'tsd';
import * as fs from "fs";
import pify = require('.');

const add = (a: number, b: number): number => a + b;

function obj() {
	return true;
}

obj.method = (value: string): string => value;

expectType<Promise<number>>(pify(add)(1, 2).then((result: number) => result));
expectType<Function>(pify(add)(1, 2).then);
expectType<(a: number, b: number) => Promise<number>>(pify(add));
expectType<Function>(pify(obj));
expectType<(value: string) => Promise<string>>(pify(obj.method));

expectType<any>(pify(fs).readFile('package.json', 'utf8').then);
