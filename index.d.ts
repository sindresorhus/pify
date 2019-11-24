import { Tuple } from 'ts-toolbelt';

interface PifyOptions {
    multiArgs?: boolean,
    include?: Array<string | RegExp>,
    exclude?: Array<string | RegExp>,
    excludeMain?: boolean,
    errorFirst?: boolean,
    promiseModule?: PromiseConstructor
}

type AnyFunction = (...args: any) => any;
type LastParameter<F extends AnyFunction> = Tuple.Last<Parameters<F>>;
type CallbackParameters<F extends AnyFunction> =
    LastParameter<F> extends AnyFunction ? Parameters<LastParameter<F>> : never;

type PifiedResolved<F extends AnyFunction, O extends PifyOptions> =
    O extends { multiArgs: true }
    ? (O extends { errorFirst: false } ? CallbackParameters<F> : Tuple.Tail<CallbackParameters<F>>)
    : CallbackParameters<F>[O extends { errorFirst: false } ? 0 : 1];
type PifiedFunction<F extends AnyFunction, O extends PifyOptions, ExcludeMain extends boolean> =
    ExcludeMain extends true ? F : (((...args: Tuple.Pop<Parameters<F>>) => Promise<PifiedResolved<F, O>>) | F);
type PifiedProperty<P extends any, O extends PifyOptions> = P extends AnyFunction ? PifiedFunction<P, O, false> : P;

type AnyObject = {[key: string]: any};
type PifiedObject<T extends AnyObject, O extends PifyOptions> = {
    [P in (keyof T)]: PifiedProperty<T[P], O>
};
type PifyInput = (AnyFunction & AnyObject) | AnyObject;
type PifyOutput<T extends PifyInput, O extends PifyOptions> = T extends AnyFunction
    ? (PifiedFunction<T, O, O extends { excludeMain: true } ? true : false> & PifiedObject<T, O>)
    : PifiedObject<T, O>;
declare function pify<T extends any, O extends PifyOptions>(input: T, options?: O): PifyOutput<T, O>;

export = pify;
