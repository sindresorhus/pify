import {expectType, expectError, expectAssignable} from 'tsd';
import pify = require('.');

const fs = {
    readFile(path: string, callback: (error?: Error, data?: Buffer) => void): void {
        callback(undefined, new Buffer('abc'))
    },
    exists(path: string, callback: (result: boolean) => void): void {
        callback(true)
    }
}

// other types
expectError(pify());
expectError(pify(42));
expectError(pify('abc'));
expectType<number[]>(pify([1,2]));

// functions
expectAssignable<() => Promise<never>>(pify(() => {}))
expectType<Promise<never>>(pify(() => {})())

expectAssignable<(path: string) => Promise<Buffer | undefined>>(pify(fs.readFile))
expectType<Promise<Buffer | undefined>>(pify(fs.readFile)('a.txt'))

declare function request(
    url: string,
    callback: (error?: Error, response?: { statusCode: number }, body?: string) => void
): void;
expectAssignable<(url: string) => Promise<[{ statusCode: number }?, string?]>>(pify(request, { multiArgs: true }))
expectType<Promise<[{ statusCode: number }?, string?]>>(pify(request, { multiArgs: true })('https://www.google.com'))

declare function request2(
    url: string,
    callback: (response?: { statusCode: number }, body?: string) => void
): void;
expectAssignable<(url: string) => Promise<[{ statusCode: number }?, string?]>>(pify(request2, { multiArgs: true, errorFirst: false }))
expectType<Promise<[{ statusCode: number }?, string?]>>(pify(request2, { multiArgs: true, errorFirst: false })('https://www.google.com'))

expectAssignable<(path: string) => Promise<boolean>>(pify(fs.exists, { errorFirst: false }))
expectType<Promise<boolean>>(pify(fs.exists, { errorFirst: false })('a.txt'))

expectAssignable<(path: string) => Promise<Buffer | undefined>>(pify(fs.readFile, { promiseModule: Promise }))
expectType<Promise<Buffer | undefined>>(pify(fs.readFile, { promiseModule: Promise })('a.txt'))

// objects
expectType<number>(pify({k1: 123, k2: 'abc'}).k1)
expectType<string>(pify({k1: 123, k2: 'abc'}).k2)

expectAssignable<(path: string) => Promise<Buffer | undefined>>(pify(fs).readFile)
expectType<Promise<Buffer | undefined>>(pify(fs).readFile('a.txt'))

expectAssignable<(path: string) => Promise<Buffer | undefined>>(pify(fs, { include: ['read'] }).readFile)
expectType<Promise<Buffer | undefined>>(pify(fs, { include: ['read'] }).readFile('a.txt'))

expectAssignable<typeof fs.readFile>(pify(fs, { exclude: ['read'] }).readFile)
expectType<void>(pify(fs, { exclude: ['read'] }).readFile('a.txt', (error?: Error, data?: Buffer) => {}))

// mixed
expectAssignable<typeof fs>(pify(fs))
expectAssignable<typeof fs>(pify(fs, { excludeMain: true }))
