/* eslint-disable @typescript-eslint/ban-types */

type Last<T extends readonly unknown[]> = T extends [...any, infer L]
	? L
	: never;
type DropLast<T extends readonly unknown[]> = T extends [...(infer U), any]
	? U
	: [];

type StringEndsWith<S, X extends string> = S extends `${infer _}${X}` ? true : false;

interface Options<Includes extends readonly unknown[], Excludes extends readonly unknown[], MultiArgs extends boolean = false> {
	multiArgs?: MultiArgs;
	include?: Includes;
	exclude?: Excludes;
}

interface InternalOptions<Includes extends readonly unknown[], Excludes extends readonly unknown[], MultiArgs extends boolean = false> {
	multiArgs: MultiArgs;
	include: Includes;
	exclude: Excludes;
}

type Promisify<Args extends readonly unknown[], GenericOptions extends InternalOptions<readonly unknown[], readonly unknown[], boolean>> = (
	...args: DropLast<Args>
) => Last<Args> extends (...args: any) => any
	? Promise<
	GenericOptions extends {multiArgs: false}
		? Last<Parameters<Last<Args>>>
		: Parameters<Last<Args>>
	>
	: never;

type PromisifyModule<
	Module extends Record<string, any>,
	MultiArgs extends boolean,
	Includes extends ReadonlyArray<keyof Module>,
	Excludes extends ReadonlyArray<keyof Module>,
> = {
	[K in keyof Module]: Module[K] extends (...args: infer Args) => any
		? K extends Includes[number]
			? Promisify<Args, InternalOptions<Includes, Excludes, MultiArgs>>
			: K extends Excludes[number]
				? Module[K]
				: StringEndsWith<K, 'Sync' | 'Stream'> extends true
					? Module[K]
					: Promisify<Args, InternalOptions<Includes, Excludes, MultiArgs>>
		: Module[K];
};

declare function pify<
	Args extends readonly unknown[],
	MultiArgs extends boolean = false,
>(
	input: (...args: Args) => any,
	options?: Options<[], [], MultiArgs>
): Promisify<Args, InternalOptions<[], [], MultiArgs>>;
declare function pify<
	Module extends Record<string, any>,
	Includes extends ReadonlyArray<keyof Module> = [],
	Excludes extends ReadonlyArray<keyof Module> = [],
	MultiArgs extends boolean = false,
>(
	// eslint-disable-next-line unicorn/prefer-module
	module: Module,
	options?: Options<Includes, Excludes, MultiArgs>
): PromisifyModule<Module, MultiArgs, Includes, Excludes>;

export = pify;
