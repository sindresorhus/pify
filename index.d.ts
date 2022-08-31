type Last<T extends readonly unknown[]> = T extends [...any, infer L]
	? L
	: never;
type DropLast<T extends readonly unknown[]> = T extends [...(infer U), any]
	? U
	: [];

interface Options {
	multiArgs: boolean;
}

type Promisify<TArgs extends readonly unknown[], TOptions extends Options> = (
	...args: DropLast<TArgs>
) => Last<TArgs> extends (...args: any) => any
	? Promise<
			TOptions extends { multiArgs: false }
				? Last<Parameters<Last<TArgs>>>
				: Parameters<Last<TArgs>>
	  >
	: never;

type PromisifyModule<TModule extends { [key: string]: any }, TOptions extends Options> = {
	[K in keyof TModule]: TModule[K] extends (...args: infer TArgs) => any ? Promisify<TArgs, TOptions> : never;
}

declare function pify<
	TArgs extends readonly unknown[],
	TOptions extends Options = { multiArgs: false }
>(
	input: (...args: TArgs) => any,
	options?: TOptions
): Promisify<TArgs, TOptions>;
declare function pify<
	TModule extends { [key: string]: any },
	TOptions extends Options = { multiArgs: false }
>(
	module: TModule,
	options?: TOptions
): PromisifyModule<TModule, TOptions>;

export = pify;
