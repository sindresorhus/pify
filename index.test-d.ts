import {expectType, expectError, expectAssignable} from 'tsd';
import * as fs from 'fs';
import pify = require('.');

declare function request(
    url: string,
    callback: (error?: Error, response?: { statusCode: number }, body?: string) => void
): void;
declare function request2(
    url: string,
    callback: (response?: { statusCode: number }, body?: string) => void
): void;

expectError(pify());
expectError(pify(42));
expectError(pify('abc'));
expectType<number[]>(pify([1,2]));

expectType<Promise<Buffer>>(pify(fs).readFile('a.txt'))
expectType<Promise<never>>(pify(() => {})())
expectType<Promise<[{ statusCode: number }?, string?]>>(pify(request, { multiArgs: true })('https://www.google.com'))
expectType<Promise<[{ statusCode: number }?, string?]>>(pify(request2, { multiArgs: true, errorFirst: false })('https://www.google.com'))
expectType<Promise<Buffer>>(pify(fs, { include: ['read'] }).readFile('a.txt'))
expectAssignable<typeof fs.readFile>(pify(fs, { exclude: ['read'] }).readFile)
expectAssignable<typeof request>(pify(request, { excludeMain: true }))
expectType<Promise<boolean>>(pify(fs.exists, { errorFirst: false })('a.txt'))
expectType<Promise<Buffer>>(pify(fs.readFile, { promiseModule: Promise })('a.txt'))
