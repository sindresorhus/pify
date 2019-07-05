interface PromiseModule {
	// This piece of code is obtained from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/pify/index.d.ts.
	new(executor: (resolve: (value?: any) => void, reject: (reason?: any) => void) => void): any;
}

interface Options {
	/**
	By default, the promisified function will only return the second argument from the callback, which works fine for most APIs. This option can be useful for modules like request that return multiple arguments. Turning this on will make it return an array of all arguments from the callback, excluding the error argument, instead of just the second argument. This also applies to rejections, where it returns an array of all the callback arguments, including the error.

	@default false
	@example
	```
	const request = require('request');
	const pify = require('pify');

	pify(request, {multiArgs: true})('https://sindresorhus.com').then(result => {
		const [httpResponse, body] = result;
	});
	```
	*/
	multiArgs?: boolean;

	/**
	Methods in a module to promisfy. Remaining methods will be left untouched.
	*/
	include?: (string | RegExp)[]

	/**
	Methods in a module not to promisify. Methods with names ending with 'Sync' are excluded by default.

	@default [/.+(Sync|Stream)$/]
	*/
	exclude?: (string | RegExp)[]

	/**
	If given module is a function itself, it will be promisified. Turn this option on if you want to promisify only methods of the module.

	@default false
	@example
	```
	const pify = require('pify');

	function fn() {
		return true;
	}

	fn.method = (data, callback) => {
		setImmediate(() => {
			callback(null, data);
		});
	};

	// Promisify methods but not `fn()`
	const promiseFn = pify(fn, {excludeMain: true});

	if (promiseFn()) {
		promiseFn.method('hi').then(data => {
			console.log(data);
		});
	}
	```
	*/
	excludeMain?: boolean;

	/**
	Whether the callback has an error as the first argument. You'll want to set this to false if you're dealing with an API that doesn't have an error as the first argument, like `fs.exists()`, some browser APIs, Chrome Extension APIs, etc.

	@default true
	*/
	errorFirst?: boolean;

	/**
	Custom promise module to use instead of the native one.
	*/
	promiseModule?: PromiseModule;
}

/**
Returns a `Promise` wrapped version of the supplied function or module.

@param input - Callback-style function or module whose methods you want to promisify.
@param options
@example
```
const fs = require('fs');
const pify = require('pify');

// Promisify a single function
pify(fs.readFile)('package.json', 'utf8').then(data => {
	console.log(JSON.parse(data).name);
	//=> 'pify'
	});

// Promisify all methods in a module
	pify(fs).readFile('package.json', 'utf8').then(data => {
	console.log(JSON.parse(data).name);
		//=> 'pify'
	});
```
*/
declare function pify<T extends (...args: any[]) => any>(input: T, options?: Options): (...args: Parameters<T>) => Promise<ReturnType<T>>;
declare function pify(input: any, options?: Options): any;

export = pify;
