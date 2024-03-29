# daizong 🏃‍♂️

[![Build Status](https://github.com/mgenware/daizong/workflows/Build/badge.svg)](https://github.com/mgenware/daizong/actions)
[![npm version](https://img.shields.io/npm/v/daizong.svg?style=flat-square)](https://npmjs.com/package/daizong)
[![Node.js Version](http://img.shields.io/node/v/daizong.svg?style=flat-square)](https://nodejs.org/en/)

`package.json` script runner for ES Modules. daizong supports the following features out of the box:

- Run tasks sequentially or in parallel
- Built-in commands (create directories, delete files and directories)
- Environment variables
  - Set environment variables for a specific task
  - Set default environment variables for all tasks
  - Define groups of environment variables to be inherited by tasks
- Define tasks in groups
- Private tasks
- Allow continue-on-error
- `before` and `after` fields

### Breaking changes

#### 0.20.0+

To avoid ambiguity between task names and arguments passed to tasks. Starting from 0.20.0, a task path has to be separated by `-` instead of a space:

```sh
# Prior to 0.20.0
daizong build windows --args # Don't use, deprecated.

# 0.20.0+
daizong build-windows --args
```

## Usage

- Install daizong as a dev dependency `npm i -D daizong` (you can skip this if you want daizong to be installed globally).
- Create a `daizong.config.js` to define tasks (see examples below).
- Use `npx daizong <task> --arg1 --arg2` to run a specific task.

<blockquote>

If you'd like to run daizong scripts in a shorter way, install daizong globally:

```sh
npm i -g daizong
```

Now instead of `npx daizong <task>`, you can do:

```sh
dz <task>
```

Note that the global `dz` command works regardless of whether daizong is installed locally or not.

</blockquote>

## Examples (daizong vs npm scripts)

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

<blockquote>

### Shorthand and full task definitions

Most tasks you see above are defined as a command string or an array of command strings:

```js
export default {
  dev: ['touch a.md', 'touch b.md'],
};
```

This is a shorthand task definition. As we're moving to more daizong features, the shorthand task definition is no longer suited and we can switch to its full definition:

```js
export default {
  // Shorthand task definition is either a string or an array of strings.
  task1: 'echo hi',

  // The `task1` above can be rewritten in its full form.
  task1: {
    run: 'echo hi',
    /* More task settings can be used here. */
  },
};
```

</blockquote>

### Run tasks in parallel

We'll need 3rd-party libraries like([concurrently](https://github.com/kimmobrunfeldt/concurrently)) to achieve this in `package.json`:

```json
{
  "scripts": {
    "dev": "concurrently \"touch a.md\" \"touch b.md\""
  }
}
```

daizong supports it out of the box:

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
    // Use `#<task_name>` to call an existing task.
    run: ['#touch1', '#touch2'],
    parallel: true,
  },
  touch1: 'touch a.md',
  touch2: 'touch b.md',
};
```

### Built-in commands

`run` also accepts an object. In that case, you are running daizong's built-in commands:

- `mkdir`: `string` creates a directory and its parents if needed.
- `del`: `string | string[]` deletes files or directories based on the given paths or globs. See [del](https://github.com/sindresorhus/del#usage) for details.
  - Examples: `del: 'dist/*.js.map'`, `del: ['a.txt', 'b.txt']`.
- `mkdirDel`: `string` = `del <dir>` + `mkdir <dir>`.

Example:

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

Parallel mode is also supported in built-in commands:

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

Note that when `parallel` is false (which is the default value), **built-in commands are executed sequentially in declaring order**:

```js
export default {
  prepare: {
    run: {
      // `del dist` runs first!
      del: 'dist',
      mkdir: 'dist',
    },
  },
};
```

The above example is equivalent to:

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

You can mix built-in commands and command strings in `run`:

```js
export default {
  prepare: {
    run: [
      // 1. Run a built-in command.
      {
        mkdir: 'dist',
      },
      // 2. Run a command.
      'echo working...',
      // 3. Run another task.
      '#build',
      // 4. Run another built-in command.
      {
        del: 'tmp',
      },
    ],
  },
};
```

### Groups

Tasks can be grouped to improve readability.

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
      run: '#build-win', '#build-linux',
      parallel: true,
    }
  },
};
```

To run a specified task in a group, separate its parent groups with `-`:

```sh
dz build-linux
dz build-all
```

### Environment variables

To support all major operating systems, you need to use 3rd-party libraries like([cross-env](https://github.com/kentcdodds/cross-env)) to achieve this in `package.json` scripts.

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
    // Use `env` to specify environment variables.
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
    // Use `envGroups` to define multiple groups of environment variables.
    envGroups: {
      production: {
        NODE_ENV: 'production',
        compression_level: 'max',
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

There are predefined env groups:

- `node:dev`: `NODE_ENV` = `development`
- `node:prod`: `NODE_ENV` = `production`

Example:

```js
export default {
  build: {
    run: 'tsc -b src',
    envGroups: ['node:dev'],
  },
};
```

#### Environment variable definitions precedence

Smaller numbers indicate higher precedence.

1. `Task.env`
2. `Task.envGroups` (last group overwrites preceding groups like `Object.assign`)
3. `_.defaultEnv`

### Continue on error

- `ignoreError` available on all tasks, defaults to `false`. If `true`, task errors are ignored.
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

Tasks that are not intended to be called from CLI, and can only be called by other tasks.

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

### Before / After

`before` and `after` allow you to specify what to run before or after a certain task.

```js
export default {
  build: {
    run: 'echo hi',
    before: ['echo prepare step 1', 'echo prepare step 1'],
    after: '#clean',
  },
  clean: 'rm -rf out',
};
```

`before` and `after` come handy when you need to mix sequential and parallel commands:

```js
export default {
  build: {
    before: '#prepare',
    after: '#clean',
    run: ['cmd1', 'cmd2', '#task1', '#task2'],
    parallel: true,
  },
  prepare: 'echo preparing',
  clean: 'rm -rf out',
};
```

It runs as:

```
prepare
  |
cmd1 | cmd2 | #task1 | #task2  <-- parallel
  |
clean
  |
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

Now you can start the task by using either `dz build` or its alias `dz b`.

### Pass arguments to a task

Append the arguments to task path:

```js
export default {
  hello: {
    run: 'echo hello',
  },
};
```

```sh
dz hello i am zzz --arg1 --arg2
```

Which runs:

```sh
echo hello i am zzz --arg1 --arg2
```

<blockquote>

NOTE: Arguments specified before task name are considered daizong arguments, not task arguments. Example:

```sh
dz --config <val> build-clean --config <val>
```

The first `--config` argument applies to the daizong CLI, while the second `--config` argument gets passed to the task.

</blockquote>

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

## Use daizong in a CommonJS module

Use `daizong.config.mjs` instead of `daizong.config.js`.
