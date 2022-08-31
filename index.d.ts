type Last<T extends readonly unknown[]> = T extends [...any, infer L]
	? L
	: never;
type DropLast<T extends readonly unknown[]> = T extends [...(infer U), any]
	? U
	: [];

type StringEndsWith<S, X extends string> = S extends `${infer _}${X}` ? true : false;

interface Options<TIncludes extends readonly unknown[], TExcludes extends readonly unknown[], TMultiArgs extends boolean = false> {
	multiArgs?: TMultiArgs;
	include?: TIncludes;
	exclude?: TExcludes;
}

interface InternalOptions<TIncludes extends readonly unknown[], TExcludes extends readonly unknown[], TMultiArgs extends boolean = false> {
	multiArgs: TMultiArgs;
	include: TIncludes;
	exclude: TExcludes;
}

type Promisify<TArgs extends readonly unknown[], TOptions extends InternalOptions<readonly unknown[], readonly unknown[], boolean>> = (
	...args: DropLast<TArgs>
) => Last<TArgs> extends (...args: any) => any
	? Promise<
			TOptions extends { multiArgs: false }
				? Last<Parameters<Last<TArgs>>>
				: Parameters<Last<TArgs>>
		>
	: never;

type PromisifyModule<
	TModule extends { [key: string]: any },
	TMultiArgs extends boolean,
	TIncludes extends ReadonlyArray<keyof TModule>,
	TExcludes extends ReadonlyArray<keyof TModule>
> = {
	[K in keyof TModule]: TModule[K] extends (...args: infer TArgs) => any
		? K extends TIncludes[number]
			? Promisify<TArgs, InternalOptions<TIncludes, TExcludes, TMultiArgs>>
			: K extends TExcludes[number]
				? TModule[K]
				: StringEndsWith<K, 'Sync' | 'Stream'> extends true
					? TModule[K]
					: Promisify<TArgs, InternalOptions<TIncludes, TExcludes, TMultiArgs>>
		: TModule[K];
};

declare function pify<
	TArgs extends readonly unknown[],
	TMultiArgs extends boolean = false,
>(
	input: (...args: TArgs) => any,
	options?: Options<[], [], TMultiArgs>
): Promisify<TArgs, InternalOptions<[], [], TMultiArgs>>;
declare function pify<
	TModule extends { [key: string]: any },
	TIncludes extends ReadonlyArray<keyof TModule> = [],
	TExcludes extends ReadonlyArray<keyof TModule> = [],
	TMultiArgs extends boolean = false,
>(
	module: TModule,
	options?: Options<TIncludes, TExcludes, TMultiArgs>
): PromisifyModule<TModule, TMultiArgs, TIncludes, TExcludes>;

export = pify;
