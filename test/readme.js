const Assert = require('assert');

describe(__filename, () => {
    it('should do read example', () => {
        const { createModule, Location } = require('..');

        const root = new Location('some/path/to/root');
        const foo = createModule(root.relative('foo'));
        const bar = createModule(root.relative('other/bar'));

        foo.import('barvar', bar);
        Assert.equal(`const barvar = require('./other/bar');`, foo.toString());
    });

    it('adding body', () => {
        const { createModule, Location, Code, Var } = require('..');

        const root = new Location('some/path/to/root');
        const foo = createModule(root.relative('foo'));
        const bar = createModule(root.relative('other/bar'));

        foo.import('barvar', bar);

        foo.add(new Code('describe(__filename, () => {'))
            .add(`it('should do some test', () => {`)
            .add(new Var('foo', new Code(10)))
            .add(new Var('bar', new Code(false)))
            .add('})')
            .add(new Code('})'));
        Assert.equal(`const barvar = require('./other/bar');describe(__filename, () => ` +
        `{it('should do some test', () => {const foo = 10;const bar = false;})})`, foo.toString());
        Assert.equal('const barvar = require(\'./other/bar\');\n\ndescribe(__filename,' +
        ' () => {\n    it(\'should do some test\', () => {\n        ' +
        'const foo = 10;\n        const bar = false;\n    });\n});', Code.pretty(foo));
    });
});
