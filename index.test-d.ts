import {expectType, expectError, expectAssignable} from 'tsd';
import * as fs from 'fs';
import pify = require('.');

declare function request(
    url: string,
    callback: (error?: Error, response?: unknown, body?: unknown) => void
): void;

expectError(pify());
expectError(pify(42));
expectError(pify('abc'));
expectError(pify([]));

expectAssignable<Buffer>(await pify(fs).readFile('a.txt'))
expectType<Array<unknown>>(await pify(request, { multiArgs: true })('https://www.google.com'))
expectAssignable<Buffer>(await pify(fs, { include: ['read'] }).readFile('a.txt'))
expectAssignable<typeof fs.readFile>(pify(fs, { exclude: ['read'] }).readFile)
expectAssignable<typeof request>(pify(request, { excludeMain: true }))
expectAssignable<boolean>(await pify<boolean>(fs.exists, { errorFirst: false })('a.txt'))
expectAssignable<Buffer>(await pify<Buffer>(fs.readFile, { promiseModule: Promise })('a.txt'))
