# pify [![Build Status](https://travis-ci.org/sindresorhus/pify.svg?branch=master)](https://travis-ci.org/sindresorhus/pify)

> Promisify a callback-style function


## Install

```
$ npm install --save pify
```


## Usage

```js
const fs = require('fs');
const pify = require('pify');

pify(fs.readFile)('package.json', 'utf8').then(data => {
	console.log(JSON.parse(data).name);
	//=> 'pify'
});

// promisify all methods in a module
const promiseFs = pify.all(fs);

promiseFs.readFile('package.json', 'utf8').then(data => {
	console.log(JSON.parse(data).name);
	//=> 'pify'
});
```


## API

### pify(input, [promiseModule])

Returns a promise wrapped version of the supplied function.

If the callback of the supplied function gets more than two arguments the result will be an array.

#### input

Type: `function`

Callback-style function.

### pify.all(module, [promiseModule])

Returns a version of the module with all its methods promisified.

#### module

Type: `object`

Module whose methods you want to promisify.

#### promiseModule

Type: `function`

Custom promise module to use instead of the native one.

Check out [`pinkie-promise`](https://github.com/floatdrop/pinkie-promise) if you need a tiny promise polyfill.


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
