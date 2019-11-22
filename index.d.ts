import { Tuple } from 'ts-toolbelt';

interface PifyOptions {
    multiArgs?: boolean,
    include?: Array<string | RegExp>,
    exclude?: Array<string | RegExp>,
    excludeMain?: boolean,
    errorFirst?: boolean,
    promiseModule?: PromiseConstructor
}

type LastParameter<F extends (...args: any) => any> = Tuple.Last<Parameters<F>>;
type CallbackFunction<F extends (...args: any) => any> =
    LastParameter<F> extends (...args: any) => any ? LastParameter<F> : never;

declare function pify<F extends (...args: any) => any>(input: F, options?: PifyOptions & { multiArgs: true, errorFirst: false }): (...args: Tuple.Pop<Parameters<F>>) => Promise<Parameters<CallbackFunction<F>>>;
declare function pify<F extends (...args: any) => any>(input: F, options?: PifyOptions & { multiArgs: true }): (...args: Tuple.Pop<Parameters<F>>) => Promise<Tuple.Tail<Parameters<CallbackFunction<F>>>>;
declare function pify<F extends (...args: any) => any>(input: F, options?: PifyOptions & { errorFirst: false }): (...args: Tuple.Pop<Parameters<F>>) => Promise<Parameters<CallbackFunction<F>>[0]>;
declare function pify<F extends (...args: any) => any>(input: F, options?: PifyOptions): (...args: Tuple.Pop<Parameters<F>>) => Promise<Parameters<CallbackFunction<F>>[1]>;
declare function pify(input: {[key: string]: unknown}, options?: PifyOptions): {[key: string]: any};

export = pify;
