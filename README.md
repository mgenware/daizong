# daizong 🏃‍♂️

[![Build Status](https://github.com/mgenware/daizong/workflows/Build/badge.svg)](https://github.com/mgenware/daizong/actions)
[![npm version](https://img.shields.io/npm/v/daizong.svg?style=flat-square)](https://npmjs.com/package/daizong)
[![Node.js Version](http://img.shields.io/node/v/daizong.svg?style=flat-square)](https://nodejs.org/en/)

`package.json` scripts runner. daizong supports the following features out of the box:

- Run tasks sequentially or in parallel
- Environment variables
  - Set environment variables for a specific task
  - Set default environment variables for all tasks
  - Define groups of environment variables to be inherited by tasks
- Define tasks in groups
- Private tasks
- Allow continue-on-error
- Actions (create directories, delete files / directories)

### Breaking changes

#### 0.20.0+

To avoid ambiguity between task names and arguments passed to tasks. Starting from 0.20.0, a task path has to be separated by `-` instead of a space:

```sh
# Prior to 0.20.0
daizong build windows --args # Don't use, deprecated.

# 0.20.0+
daizong build-windows --args
```

## Installation

```sh
npm i daizong -D
```

## Usage

Add daizong to `package.json` scripts (`r` is short for "run"):

```json
{
  "scripts": {
    "r": "daizong"
  }
}
```

Create a `daizong.config.js` at the root of your project. Use `npm run r <task>` or `yarn r <task>` to start a task.

## Examples / Comparison with `package.json` scripts

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
export default {
  dev: 'tsc -b src -w',
};
```

### Run tasks sequentially

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
export default {
  dev: ['touch a.md', 'touch b.md'],
};
```

### Run tasks in parallel

In `package.json`, to support all major systems, you need to use 3rd-party libraries like([concurrently](https://github.com/kimmobrunfeldt/concurrently)) to achieve this.

`package.json`:

```json
{
  "scripts": {
    "dev": "concurrently \"touch a.md\" \"touch b.md\""
  }
}
```

daizong supports it out of the box:

<blockquote>
Full task definition: Since we're using more advanced features of a task, the shorthand task definition is no longer suited. We switch to the full task definition in the following example.

```js
export default {
  // Shorthand: task value is either a string or an array of strings.
  task1: 'echo hi',

  // Full: task value is an object with a `run` field.
  task2: {
    run: 'echo hi',
    /* More task settings can be used here. */
  },
};
```

</blockquote>

```js
export default {
  dev: {
    run: ['touch a.md', 'touch b.md'],
    parallel: true,
  },
};
```

### Reuse a task

`package.json`:

```json
{
  "scripts": {
    "dev": "concurrently \"npm run touch1\" \"npm run touch2\"",
    "touch1": "touch a.md",
    "touch2": "touch b.md"
  }
}
```

daizong:

```js
export default {
  dev: {
    run: ['#touch1', '#touch2'],
    parallel: true,
  },
  touch1: 'touch a.md',
  touch2: 'touch b.md',
};
```

### Nested tasks

Tasks can be nested to significantly improve readability.

```js
export default {
  build: {
    win: {
      run: 'echo Windows build started',
    },
    linux: {
      run: 'echo Linux build started',
    },
    all: {
      run: '#build win', '#build linux',
      parallel: true,
    }
  },
};
```

To run a specific nested task, you specified the task path separated by `-`:

```sh
npm run r build-linux
npm run r build-all
```

### Environment variables

To support all major systems, you need to use 3rd-party libraries like([cross-env](https://github.com/kentcdodds/cross-env)) to achieve this in `package.json` scripts.

`package.json`:

```json
{
  "scripts": {
    "build": "cross-env NODE_ENV=production tsc -b src",
    "dev": "cross-env NODE_ENV=development tsc -b src -w"
  }
}
```

daizong supports it out of the box:

```js
export default {
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

Default environment variables are also supported. Once configured, they will be automatically applied to all tasks:

```js
export default {
  // "_" is a preserved field for configuration.
  _: {
    defaultEnv: {
      NODE_ENV: 'development',
    },
  },
  dev: {
    // NODE_ENV is 'development'
    run: 'tsc -b src -w',
  },
  build: {
    // NODE_ENV is 'production'
    run: 'tsc -b src',
    env: {
      NODE_ENV: 'production',
    },
  },
};
```

You can also define groups of environment variables to be inherited by tasks:

```js
export default {
  // "_" is a preserved field for configuration.
  _: {
    defaultEnv: {
      NODE_ENV: 'development',
    },
    envGroups: {
      production: {
        NODE_ENV: 'production',
        compression_level: 'max
      },
    },
  },
  dev: {
    // NODE_ENV is 'development'
    run: 'tsc -b src -w',
  },
  build-windows: {
    run: 'build',
    env: {
      platform: 'windows'
    },
    // This task has all environment variables defined in "production" group.
    envGroups: ['production'],
  },
  build-macos: {
    run: 'build',
    env: {
      platform: 'macos'
    },
    // This task has all environment variables defined in "production" group.
    envGroups: ['production'],
  },
};
```

#### Environment variable definitions precedence

Smaller numbers indicate higher precedence.

1. `Task.env`
2. `Task.envGroups` (last group overwrites preceding groups like `Object.assign`)
3. `_.defaultEnv`

### Continue on error

- `ignoreError` available on all tasks, defaults to `false`. If `true`, task failure is ignored and won't stop execution.
- `continueOnChildError` only available on tasks with multiple subtasks. It controls if pending subtasks continue to run when one subtask fails. Defaults to `false`.

Example:

```js
export default {
  build: {
    run: [
      '#clean',
      // The `tsc` command will always run regardless of the result of clean command.
      'tsc',
    ],
  },
  clean: {
    run: 'echo cleaning...',
    ignoreError: true,
  },
};
```

### Private tasks

Tasks that are not intended to be called from outside, and can only be called by other tasks.

```js
// You cannot call the "clean" task via `daizong clean`.
// It can only be called by other tasks.
export default {
  // "_" is a preserved field for configuration.
  _: {
    privateTasks: {
      clean: {
        run: 'echo cleaning...',
      },
    },
  },
  build: {
    run: ['#clean', 'tsc'],
  },
};
```

### Actions

Actions are a set of commonly used commands you can choose to run before or after a task:

```js
export default {
  task: {
    run: 'echo hi',
    before: {
      // Actions ...
    },
    after: {
      // Actions ...
    },
  },
};
```

daizong currently supports the following actions:

- `mkdir`: `string` creates a directory and its parents if needed.
- `del`: `string | string[]` deletes files or directories based on the given paths or globs. See [del](https://github.com/sindresorhus/del#usage) for details.
  - Examples: `del: 'dist/*.js.map'`, `del: ['a.txt', 'b.txt']`.
- `mkdirDel`: `string` = `del <dir>` + `mkdir <dir>`.

For example, to create a `/dist` directory before running task `dev`, and delete all `js.map` files when it's done:

```js
export default {
  dev: {
    run: 'echo dev',
    before: {
      mkdir: 'dist',
    },
    after: {
      del: 'dist/*.js.map',
    },
  },
};
```

Actions can be reused by simply wrapping them in `run`:

```js
export default {
  prepare: {
    run: {
      mkdir: 'dist',
      del: 'cache',
    },
  },
  dev: {
    run: ['#prepare', 'echo dev'],
  },
  build: {
    run: ['#prepare', 'echo build'],
  },
};
```

Actions also support parallel execution:

```js
export default {
  prepare: {
    run: {
      mkdir: 'dist',
      del: 'cache',
      parallel: true,
    },
  },
  dev: {
    run: ['#prepare', 'echo dev'],
  },
  build: {
    run: ['#prepare', 'echo build'],
  },
};
```

Note that when `parallel` is false (which is the default value), **actions are executed sequentially in insertion order**:

```js
export default {
  prepare: {
    run: {
      // `del dist` always runs first!
      del: 'dist',
      mkdir: 'dist',
    },
  },
};
```

The above example is also equivalent to:

```js
export default {
  prepare: {
    run: {
      // `mkdirDel` deletes and then creates the specified directory.
      mkdirDel: 'dist',
    },
  },
};
```

### Aliases

> Note: To keep things simple, aliases are only allowed in top-level public tasks.

You can set an alias for a public task:

```js
export default {
  build: {
    run: ['#build-windows', '#build-macos', '#build-linux'],
    parallel: true,
    alias: 'b',
  },
};
```

Now you can start the task by using either `build` or its alias form `b`.

### Pass arguments to task command

Just append the arguments to the task path:

```js
export default {
  hello: {
    run: 'echo hello',
  },
};
```

```sh
npm run r hello i am zzz
```

Which runs:

```sh
echo hello i am zzz
```

## CLI Usage

```sh
  Usage
    $ daizong [options] <task-path> [task arguments]

  Options
    --config       Explicitly specify the config file, `--config config.js`
    --verbose      Print verbose information during execution
    --private      Allow private tasks to be called from CLI
    --version, -v  Print version information

  Examples
    $ daizong --verbose test-browser --script-arg1 --script-arg2
```
