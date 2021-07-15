type AnyFunction = (...args: any[]) => any;
type CallbackError = Error | null | undefined;

// Utility types

type Last<T extends unknown[]> =
	T extends [] ? never :
	T extends [...infer _, infer R] ? R :
	T extends [...infer _, (infer R)?] ? R | undefined:
	never;

type ExceptLast<T extends any[]> = T extends [ ...infer Head, any ] ? Head : any[];

type LastParameter<T extends AnyFunction> = Last<Parameters<T>>;
type ParametersExceptLast<T extends AnyFunction> = ExceptLast<Parameters<T>>;

type SelectByOptionOr<O extends boolean, TTrue, TFalse> =
	O extends true ? TTrue :
	O extends false ? TFalse :
	TTrue | TFalse;

type Resolve<T> = [T][0];
// End of utility types

type CallbackSingleReturnType<
	T extends AnyFunction,
	TCb extends AnyFunction = LastParameter<T>,
	TCbArgs = Parameters<Exclude<TCb, undefined>>
> =
	TCbArgs extends [CallbackError?] ? void :
	TCbArgs extends [CallbackError, infer U] ? U :
	TCbArgs extends any[] ? TCbArgs[1] extends undefined ? void : TCbArgs[1]:
	never;

type CallbackMultiReturnType<
	T extends AnyFunction,
	TCb extends AnyFunction = LastParameter<T>,
	TCbArgs = Parameters<Exclude<TCb, undefined>>
> =
	TCbArgs extends [any, ... infer U] ? U :
	TCbArgs extends [any?, ... infer U] ? U :
	TCbArgs extends [any] ? [] :
	TCbArgs extends [any?] ? [] :
	TCbArgs extends [] ? [] :
	never;

type CallbackWithoutErrorSingleReturnType<T extends AnyFunction> = Parameters<LastParameter<T>> extends [] ? void : Parameters<LastParameter<T>>[0];

type CallbackWithoutErrorMultiReturnType<T extends AnyFunction> = Parameters<LastParameter<T>>;

type CallbackReturn<T extends AnyFunction, MultiArgs extends boolean, ErrorFirst extends boolean> = SelectByOptionOr<ErrorFirst,
	SelectByOptionOr<MultiArgs, CallbackMultiReturnType<T>, CallbackSingleReturnType<T>>,
	SelectByOptionOr<MultiArgs, CallbackWithoutErrorMultiReturnType<T>, CallbackWithoutErrorSingleReturnType<T>>>;

type PifiedFunction<F extends AnyFunction, O extends PifyOptions> = Resolve<(...args:ParametersExceptLast<F>) => Promise<CallbackReturn<F, GetMultiArgs<O>, GetErrorFirst<O>>>>;

type GetOption<O extends PifyOptions, Name extends string, Default extends boolean> =
	O extends {[F in Name]: true} ? true :
	O extends {[F in Name]: false} ? false :
	O extends {[F in Name]: boolean} ? boolean :
	O extends {[F in Name]: undefined} ? Default :
	Default;
type GetExcludeMain<O extends PifyOptions> = Resolve<GetOption<O, 'excludeMain', false>>;
type GetErrorFirst<O extends PifyOptions> = Resolve<GetOption<O, 'errorFirst', true>>;
type GetMultiArgs<O extends PifyOptions> = Resolve<GetOption<O, 'multiArgs', false>>;

type PifiedObject<T, O extends PifyOptions> = Resolve<{
	[Key in (keyof T)]: T[Key] extends AnyFunction ? PifiedFunction<T[Key], O> : T[Key];
}>;

type PifiedObjectFunction<T, O extends PifyOptions> = Resolve<
	GetExcludeMain<O> extends true ?
		T extends AnyFunction	?
			({} extends T ? T & PifiedObject<T, O> : T) :
			PifiedObject<T, O> :
		T extends AnyFunction ?
			LastParameter<T> extends never ? never : LastParameter<T> extends AnyFunction ?
				({} extends T ? PifiedFunction<T, O> & PifiedObject<T, O> : PifiedFunction<T, O>) :
				never :
			PifiedObject<T, O>
	>;

interface PifyOptions {
	/**
	By default, the promisified function will only return the second argument from the callback, which works fine for most APIs. This option can be useful for modules like `request` that return multiple arguments. Turning this on will make it return an array of all arguments from the callback, excluding the error argument, instead of just the second argument. This also applies to rejections, where it returns an array of all the callback arguments, including the error.
	@default false
	@example
	```
	const request = require('request');
	const pify = require('pify');
	const pRequest = pify(request, {multiArgs: true});
	(async () => {
		const [httpResponse, body] = await pRequest('https://sindresorhus.com');
	})();
	```
	*/
	readonly multiArgs?: boolean,

	/**
	Methods in a module to promisfy. Remaining methods will be left untouched. Does not affect typescript compile time types.
	*/
	readonly include?: Array<string | RegExp>,

	/**
	Methods in a module not to promisify. Methods with names ending with 'Sync' are excluded by default. Does not the type of return value in compile time.
	@default [/.+(Sync|Stream)$/]
	*/
	readonly exclude?: Array<string | RegExp>,

	/**
	If the given module is a function itself, it will be promisified. Enable this option if you want to promisify only methods of the module.
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
	(async () => {
		// Promisify methods but not `fn()`
		const promiseFn = pify(fn, {excludeMain: true});
		if (promiseFn()) {
			console.log(await promiseFn.method('hi'));
		}
	})();
	```
	*/
	readonly excludeMain?: boolean,

	/**
	Whether the callback has an error as the first argument. You'll want to set this to false if you're dealing with an API that doesn't have an error as the first argument, like `fs.exists()`, some browser APIs, Chrome Extension APIs, etc.
	@default true
	*/
	readonly errorFirst?: boolean,

	/**
	Custom promise module to use instead of the native one.
	*/
	readonly promiseModule?: PromiseConstructor
}

interface PifyOptionsMultiArgs0ErrorFirst1 extends PifyOptions {
	multiArgs?: false | undefined;
	errorFirst?: true | undefined;
	excludeMain: false | undefined;
}
interface PifyOptionsMultiArgs0ErrorFirst0 extends PifyOptions {
	multiArgs?: false | undefined;
	errorFirst: false;
	excludeMain: false | undefined;
}
interface PifyOptionsMultiArgs1ErrorFirst1 extends PifyOptions {
	multiArgs: true;
	errorFirst?: true | undefined;
	excludeMain: false | undefined;
}
interface PifyOptionsMultiArgs1ErrorFirst0 extends PifyOptions {
	multiArgs: true;
	errorFirst: false;
	excludeMain: false | undefined;
}

/**
Returns a `Promise` wrapped version of the supplied function or module.
@param input - Callback-style function or module whose methods you want to promisify.
@returns Wrapped version of the supplied function or module.
@example
```
const fs = require('fs');
const pify = require('pify');
(async () => {
	// Promisify a single function
	const data = await pify(fs.readFile)('package.json', 'utf8');
	console.log(JSON.parse(data).name);
	//=> 'pify'
	// Promisify all methods in a module
	const data2 = await pify(fs).readFile('package.json', 'utf8');
	console.log(JSON.parse(data2).name);
	//=> 'pify'
})();
```
*/
declare function pify<Options extends PifyOptionsMultiArgs1ErrorFirst0, AT extends any[]>(fn:(...args:[...AT, () => any]) => any, options:Options): (...args:[...AT]) => Promise<[]>;
declare function pify<Options extends PifyOptionsMultiArgs0ErrorFirst0, AT extends any[]>(fn:(...args:[...AT, () => any]) => any, options:Options): (...args:[...AT]) => Promise<void>;
declare function pify<Options extends PifyOptionsMultiArgs1ErrorFirst1, AT extends any[]>(fn:(...args:[...AT, (error: CallbackError) => any]) => any, options:Options): (...args:[...AT]) => Promise<[]>;
declare function pify<Options extends PifyOptionsMultiArgs0ErrorFirst1, AT extends any[]>(fn:(...args:[...AT, (error: CallbackError) => any]) => any, options:Options): (...args:[...AT]) => Promise<void>;
declare function pify<Options extends PifyOptionsMultiArgs1ErrorFirst0, AT extends any[], RT1 extends any, RT extends any[]>(fn:(...args:[...AT, (...returns:[RT1, ...RT]) => any]) => any, options:Options): (...args:[...AT]) => Promise<RT>;
declare function pify<Options extends PifyOptionsMultiArgs0ErrorFirst0, AT extends any[], RT1 extends any, RT extends any[]>(fn:(...args:[...AT, (...returns:[RT1, ...RT]) => any]) => any, options:Options): (...args:[...AT]) => Promise<RT1>;
declare function pify<Options extends PifyOptionsMultiArgs1ErrorFirst1, AT extends any[], RT1 extends any, RT extends any[]>(fn:(...args:[...AT, (error: CallbackError, ...returns:[RT1, ...RT]) => any]) => any, options:Options): (...args:[...AT]) => Promise<[RT1, ...RT]>;
declare function pify<Options extends PifyOptionsMultiArgs0ErrorFirst1, AT extends any[], RT1 extends any, RT extends any[]>(fn:(...args:[...AT, (error: CallbackError, ...returns:[RT1, ...RT]) => any]) => any, options:Options): (...args:[...AT]) => Promise<RT1>;
declare function pify<AT extends any[], RT1 extends any, RT extends any[]>(fn:(...args:[...AT, (error: CallbackError, ...returns:[RT1, ...RT]) => any]) => any): (...args:[...AT]) => Promise<RT1>;
declare function pify<AT extends any[]>(fn:(...args:[...AT, (error: CallbackError) => any]) => any): (...args:[...AT]) => Promise<void>;
declare function pify<T extends Function | object, Options extends PifyOptions>(fn: T, options?: Options): PifiedObjectFunction<T, Options>;

export = pify;
