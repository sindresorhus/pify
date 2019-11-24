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
    Tuple.Length<Parameters<F>> extends 0 ? never :
    LastParameter<F> extends AnyFunction ? Parameters<LastParameter<F>> : never;

type PifiedResolved<F extends AnyFunction, O extends PifyOptions> =
    O extends { multiArgs: true }
    ? (O extends { errorFirst: false } ? CallbackParameters<F> : Tuple.Tail<CallbackParameters<F>>)
    : CallbackParameters<F>[O extends { errorFirst: false } ? 0 : 1];
type PifiedFunction<F extends AnyFunction, O extends PifyOptions> =
    (...args: Tuple.Pop<Parameters<F>>) => Promise<PifiedResolved<F, O>>;
type PifiedProperty<P extends any, O extends PifyOptions> = P extends AnyFunction ? (PifiedFunction<P, O> & P) : P;

type AnyObject = {[key: string]: any};
type PifiedObject<T extends AnyObject, O extends PifyOptions> = {
    [P in (keyof T)]: PifiedProperty<T[P], O>
};
type PifyInput = (AnyFunction & AnyObject) | AnyObject;
type PifyOutput<T extends PifyInput, O extends PifyOptions> = T extends AnyFunction
    ? (O extends { excludeMain: true } ? T : PifiedFunction<T, O>) & PifiedObject<T, O>
    : PifiedObject<T, O>;
declare function pify<T extends PifyInput, O extends PifyOptions>(input: T, options?: O): PifyOutput<T, O>;

export = pify;
