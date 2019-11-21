interface PifyOptions {
    multiArgs?: boolean,
    include?: Array<string | RegExp>,
    exclude?: Array<string | RegExp>,
    excludeMain?: boolean,
    errorFirst?: boolean,
    promiseModule?: PromiseConstructor
}

declare function pify(input: Function, options?: PifyOptions & { multiArgs: true }): (...args: unknown[]) => Promise<Array<unknown>>;
declare function pify<T extends unknown>(input: Function, options?: PifyOptions): (...args: unknown[]) => Promise<T>;
declare function pify(input: {[key: string]: unknown}, options?: PifyOptions): {[key: string]: any};

export = pify;
