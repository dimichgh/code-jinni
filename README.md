code-generator
==================

The module allow to create a simple way to onstruct dom of code snippets that can be rendered at the end into javascript code.

One way to use it is to create templates for code generation with dynamic elements that can be related to each other. This would allow, for example, by changing base for some modules, it will modify imports in the module that import the affected modules.

## Install

```bash
yarn add code-jinni
```

## Usage


### External module

```js
const { Module } = require('code-generator/module');
const mod = new Module('foo');
console.log(mod.getPath()); // foo
```

### Relative module

```js
const { Module, Location } = require('code-generator/module');

const root = new Location('some/path/to/root');
const foo = new Module('foo', root.relative('foo'));
console.log(mod.getPath()); // some/path/to/root/foo
```

### Adding import to the module

```js
const { Module, Location } = require('code-generator');

const root = new Location('some/path/to/root');
const foo = new Module('foo', root.relative('foo'));
const bar = new Module('bar', root.relative('other/bar'));

foo.import('barvar', bar);
console.log(foo.toString()); // >> const barvar = require('./other/bar');
```

### Adding body to the module

```js
const { Module, Location, Code, Var } = require('code-generator');

const root = new Location('some/path/to/root');
const foo = new Module('foo', root.relative('foo'));
const bar = new Module('bar', root.relative('other/bar'));

foo.import('barvar', bar);

foo.add(new Code('describe(__filename, () => {'))
        .add(`it('should do some test', () => {`)
            .add(new Var('foo', 10))
            .add(new Var('bar', false))
        .add('})')
    .add(new Code('})'))
console.log(foo.toString()); 
// >> const barvar = require('./other/bar');describe(__filename, () => {it('should do some test', () => {const foo = 10;const bar = ;})})
```

### Pretty print

```js
console.log(Code.pretty(foo)); 
```

output:
```js
const barvar = require("./other/bar");

describe(__filename, () => {
    it("should do some test", () => {
        const foo = 10;
        const bar = false;
    });
});
```