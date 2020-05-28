# daizong

[![Build Status](https://github.com/mgenware/daizong/workflows/Build/badge.svg)](https://github.com/mgenware/daizong/actions)
[![npm version](https://img.shields.io/npm/v/daizong.svg?style=flat-square)](https://npmjs.com/package/daizong)
[![Node.js Version](http://img.shields.io/node/v/daizong.svg?style=flat-square)](https://nodejs.org/en/)

Command runner. Better package.json scripts.

## Installation

```sh
yarn add daizong -D
```

## Usage

Add daizong to `package.json` scripts (`r` stands for "run"):

```json
{
  "scripts": {
    "r": "daizong"
  }
}
```

Create a `daizong.config.js` at the root of your project, and run `yarn r <task>` to start a task.

## Examples / Comparison with `package.json` scripts

### Single script

`package.json`:

```json
{
  "scripts": {
    "dev": "tsc -b src -w"
  }
}
```

daizong:

```js
module.exports = {
  dev: {
    run: 'tsc -b src -w',
  },
};
```

### Multiple scripts

`package.json`:

```json
{
  "scripts": {
    "dev": "touch a.md && touch b.md"
  }
}
```

daizong:

```js
module.exports = {
  dev: {
    run: ['touch a.md', 'touch b.md'],
  },
};
```

### Run multiple scripts in parallel

To support all major systems, you need to use 3rd-party libs like([concurrently](https://github.com/kimmobrunfeldt/concurrently)) to achieve this in `package.json` scripts:

```json
{
  "scripts": {
    "dev": "concurrently --kill-others \"touch a.md\" \"touch b.md\""
  }
}
```

daizong:

```js
module.exports = {
  dev: {
    run: ['touch a.md', 'touch b.md'],
    parallel: true,
  },
};
```

### Reuse a script

`package.json`:

```json
{
  "scripts": {
    "dev": "concurrently \"yarn run touch1\" \"yarn run touch2\"",
    "touch1": "touch a.md",
    "touch2": "touch b.md"
  }
}
```

daizong:

```js
module.exports = {
  dev: {
    run: ['#touch1', '#touch2'],
    parallel: true,
  },
  touch1: {
    run: 'touch a.md',
  },
  touch2: {
    run: 'touch b.md',
  },
};
```

### Environment variables

To support all major systems, you need to use 3rd-party libs like([cross-env](https://github.com/kentcdodds/cross-env)) to achieve this in `package.json` scripts:

```json
{
  "scripts": {
    "build": "cross-env NODE_ENV=production tsc -b src",
    "dev": "cross-env NODE_ENV=development tsc -b src -w"
  }
}
```

daizong:

```js
module.exports = {
  build: {
    run: 'tsc -b src',
    env: {
      NODE_ENV: 'production',
    },
  },
  dev: {
    run: 'tsc -b src -w',
    env: {
      NODE_ENV: 'development',
    },
  },
};
```

### Ignore a sub command error

Set `ignoreError` to `true` in sub command.

```js
module.exports = {
  build: {
    run: [
      '#clean',
      // The `tsc` command will always run regardless of the result of clean command.
      'tsc',
    ],
  },
  clean: {
    run: 'rimraf ./dist',
    ignoreError: true,
  },
};
```
