/* eslint-disable @typescript-eslint/ban-types */

type LastArrayElement<T extends readonly unknown[]> = T extends [...any, infer L]
	? L
	: never;

type DropLastArrayElement<T extends readonly unknown[]> = T extends [...(infer U), unknown]
	? U
	: [];

type StringEndsWith<S, X extends string> = S extends `${infer _}${X}` ? true : false;

type Options<Includes extends readonly unknown[], Excludes extends readonly unknown[], MultiArgs extends boolean = false, ErrorFirst extends boolean = true, ExcludeMain extends boolean = false> = {
	multiArgs?: MultiArgs;
	include?: Includes;
	exclude?: Excludes;
	errorFirst?: ErrorFirst;
	promiseModule?: PromiseConstructor;
	excludeMain?: ExcludeMain;
};

type InternalOptions<Includes extends readonly unknown[], Excludes extends readonly unknown[], MultiArgs extends boolean = false, ErrorFirst extends boolean = true> = {
	multiArgs: MultiArgs;
	include: Includes;
	exclude: Excludes;
	errorFirst: ErrorFirst;
};

type Promisify<Args extends readonly unknown[], GenericOptions extends InternalOptions<readonly unknown[], readonly unknown[], boolean, boolean>> = (
	...args: DropLastArrayElement<Args>
) =>
LastArrayElement<Args> extends (...arguments_: any) => any
// For single-argument functions when errorFirst: true we just return Promise<unknown> as it will always reject.
	? Parameters<LastArrayElement<Args>> extends [infer SingleCallbackArg] ? GenericOptions extends {errorFirst: true} ? Promise<unknown> : Promise<SingleCallbackArg>
		: Promise<
		GenericOptions extends {multiArgs: false}
			? LastArrayElement<Parameters<LastArrayElement<Args>>>
			: Parameters<LastArrayElement<Args>>
		>
	// Functions without a callback will return a promise that never settles. We model this as Promise<unknown>
	: Promise<unknown>;

type PromisifyModule<
	Module extends Record<string, any>,
	MultiArgs extends boolean,
	ErrorFirst extends boolean,
	Includes extends ReadonlyArray<keyof Module>,
	Excludes extends ReadonlyArray<keyof Module>,
> = {
	[K in keyof Module]: Module[K] extends (...arguments_: infer Arguments) => any
		? K extends Includes[number]
			? Promisify<Arguments, InternalOptions<Includes, Excludes, MultiArgs>>
			: K extends Excludes[number]
				? Module[K]
				: StringEndsWith<K, 'Sync' | 'Stream'> extends true
					? Module[K]
					: Promisify<Arguments, InternalOptions<Includes, Excludes, MultiArgs, ErrorFirst>>
		: Module[K];
};

export default function pify<
	FirstArgument,
	Arguments extends readonly unknown[],
	MultiArgs extends boolean = false,
	ErrorFirst extends boolean = true,
>(
	input: (argument: FirstArgument, ...arguments_: Arguments) => any,
	options?: Options<[], [], MultiArgs, ErrorFirst>
): Promisify<[FirstArgument, ...Arguments], InternalOptions<[], [], MultiArgs, ErrorFirst>>;
export default function pify<
	Module extends Record<string, any>,
	Includes extends ReadonlyArray<keyof Module> = [],
	Excludes extends ReadonlyArray<keyof Module> = [],
	MultiArgs extends boolean = false,
	ErrorFirst extends boolean = true,
>(
	// eslint-disable-next-line unicorn/prefer-module
	module: Module,
	options?: Options<Includes, Excludes, MultiArgs, ErrorFirst, true>
): PromisifyModule<Module, MultiArgs, ErrorFirst, Includes, Excludes>;
