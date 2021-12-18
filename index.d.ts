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

declare function pify<
	TArgs extends readonly unknown[],
	TOptions extends Options = { multiArgs: false }
>(
	input: (...args: TArgs) => any,
	options?: TOptions
): Promisify<TArgs, TOptions>;

export = pify;
