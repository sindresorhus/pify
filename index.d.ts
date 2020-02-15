import { Tuple } from 'ts-toolbelt';

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
    multiArgs?: boolean,

    /**
	Methods in a module to promisfy. Remaining methods will be left untouched.
	*/
    include?: Array<string | RegExp>,

    /**
    Methods in a module not to promisify. Methods with names ending with 'Sync' are excluded by default.

	@default [/.+(Sync|Stream)$/]
	*/
    exclude?: Array<string | RegExp>,

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
    excludeMain?: boolean,

    /**
    Whether the callback has an error as the first argument. You'll want to set this to false if you're dealing with an API that doesn't have an error as the first argument, like `fs.exists()`, some browser APIs, Chrome Extension APIs, etc.

	@default true
	*/
    errorFirst?: boolean,

    /**
	Custom promise module to use instead of the native one.
	*/
    promiseModule?: PromiseConstructor
}

type AnyFunction = (...args: any) => any;
type LastParameter<InputFunction extends AnyFunction> = Tuple.Last<Parameters<InputFunction>>;
type CallbackParameters<InputFunction extends AnyFunction> =
    Tuple.Length<Parameters<InputFunction>> extends 0 ? never :
    LastParameter<InputFunction> extends AnyFunction ? Parameters<LastParameter<InputFunction>> : never;

type PifiedResolved<InputFunction extends AnyFunction, Options extends PifyOptions> =
    Options extends { multiArgs: true }
    ? (Options extends { errorFirst: false } ? CallbackParameters<InputFunction> : Tuple.Tail<CallbackParameters<InputFunction>>)
    : CallbackParameters<InputFunction>[Options extends { errorFirst: false } ? 0 : 1];
type PifiedFunction<InputFunction extends AnyFunction, Options extends PifyOptions> =
    (...args: Tuple.Pop<Parameters<InputFunction>>) => Promise<PifiedResolved<InputFunction, Options>>;
type PifiedProperty<PropertyValue extends any, Options extends PifyOptions> = PropertyValue extends AnyFunction ? (PifiedFunction<PropertyValue, Options> & PropertyValue) : PropertyValue;

type AnyObject = {[key: string]: any};
type PifiedObject<Input extends AnyObject, Options extends PifyOptions> = {
    [PropertyKey in (keyof Input)]: PifiedProperty<Input[PropertyKey], Options>
};
type PifyInput = (AnyFunction & AnyObject) | AnyObject;
type PifyOutput<Input extends PifyInput, Options extends PifyOptions> = Input extends AnyFunction
    ? (Options extends { excludeMain: true } ? Input : PifiedFunction<Input, Options>) & PifiedObject<Input, Options>
    : PifiedObject<Input, Options>;

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
declare function pify<Input extends PifyInput, Options extends PifyOptions>(input: Input, options?: Options): PifyOutput<Input, Options>;

export = pify;
