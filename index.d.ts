import { Tuple } from 'ts-toolbelt';

interface PifyOptions {
    multiArgs?: boolean,
    include?: Array<string | RegExp>,
    exclude?: Array<string | RegExp>,
    excludeMain?: boolean,
    errorFirst?: boolean,
    promiseModule?: PromiseConstructor
}

type AnyFunction = (...args: any) => any
type LastParameter<F extends AnyFunction> = Tuple.Last<Parameters<F>>;
type CallbackParameters<F extends AnyFunction> =
    LastParameter<F> extends AnyFunction ? Parameters<LastParameter<F>> : never;
type PifiedFunction<F extends AnyFunction, R> = (...args: Tuple.Pop<Parameters<F>>) => Promise<R>

declare function pify<F extends AnyFunction>(input: F, options?: PifyOptions & { multiArgs: true, errorFirst: false }): PifiedFunction<F, CallbackParameters<F>>;
declare function pify<F extends AnyFunction>(input: F, options?: PifyOptions & { multiArgs: true }): PifiedFunction<F, Tuple.Tail<CallbackParameters<F>>>;
declare function pify<F extends AnyFunction>(input: F, options?: PifyOptions & { errorFirst: false }): PifiedFunction<F, CallbackParameters<F>[0]>;
declare function pify<F extends AnyFunction>(input: F, options?: PifyOptions): PifiedFunction<F, CallbackParameters<F>[1]>;
declare function pify(input: {[key: string]: unknown}, options?: PifyOptions): {[key: string]: any};

export = pify;
