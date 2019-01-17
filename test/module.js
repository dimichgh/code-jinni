const Assert = require('assert');
const { createModule, cache } = require('../module');
const { Location } = require('../location');

describe(__filename, () => {
    beforeEach(() => {
        cache.clear();
    });

    it('should create an empty module', () => {
        const code = createModule(new Location('path/to/root'));
        Assert.equal('', code.toString());
    });

    it('should create a simple module', () => {
        const code = createModule(new Location('path/to/root'));
        code.add('body');
        Assert.equal('body', code.toString());
    });

    it('should add import relative', () => {
        const foo = createModule(new Location('./path/to/foo'));
        const bar = createModule(new Location('./path/to/bar'));
        foo.add('body');
        foo.import('bar', bar);
        Assert.equal(`const bar = require('./bar');body`, foo.toString());
    });

    it('should add import of external module', () => {
        const foo = createModule(new Location('./path/to/foo'));
        Assert.ok(!foo.external);
        const bar = createModule('bar');
        Assert.ok(bar.external);
        foo.add('body');
        foo.import('bar', bar);
        Assert.equal(`const bar = require('bar');body`, foo.toString());
    });

    it('should add multiple imports', () => {
        const foo = createModule(new Location('./path/to/foo'));
        const bar = createModule('bar');
        const qaz = createModule('qaz');
        const wsx = createModule(new Location('path/other/wsx'));
        foo.add('body');
        foo.import('bar', bar);
        foo.import('qaz', qaz);
        foo.import('wsx', wsx);
        Assert.equal(`const bar = require('bar');const qaz = ` +
        `require('qaz');const wsx = require('../other/wsx');body`, foo.toString());
    });

    it('should not allow to get content for external module', () => {
        const bar = createModule('bar');
        Assert.ok(bar.external);
        Assert.throws(() => {
            bar.toString();
        }, /You cannot serialize external module bar/);
    });

    it('should not allow to get content for external module', () => {
        const bar = createModule('bar');
        Assert.ok(bar.external);
        Assert.throws(() => {
            bar.import('foo', createModule('foo'));
        }, /You cannot add import to external module bar/);
    });

    it('should modify imports when base changes for one', () => {
        const baseLocation = new Location('./path');
        const foo = createModule(baseLocation.relative('too/foo'));
        const bar = createModule('bar');
        const qaz = createModule('qaz');
        const wsx = createModule(new Location('path/other/wsx'));
        foo.add('body');
        foo.import('bar', bar);
        foo.import('qaz', qaz);
        foo.import('wsx', wsx);
        Assert.equal(`const bar = require('bar');const qaz = require('qaz');` +
        `const wsx = require('../other/wsx');body`, foo.toString());

        baseLocation.root = 'path/deep';
        Assert.equal(`const bar = require('bar');const qaz = require('qaz');` +
        `const wsx = require('../../other/wsx');body`, foo.toString());
    });

    it('should dedup duplicate imports, external modules', () => {
        const baseLocation = new Location('./path');
        const foo = createModule(baseLocation.relative('too/foo'));
        const bar = createModule('bar');
        const dupBar = createModule('bar');

        foo.import('bar', bar);
        // it should update a var ref of the affected import
        foo.import('dupbar', dupBar);
        Assert.equal(`const bar = require('bar');const dupbar = require('bar');`, foo.toString());
        // now if we modify module name, both imports should be updated
        bar.location.root = 'bar-updated';
        Assert.equal(`const bar = require('bar-updated');const dupbar = require('bar-updated');`, foo.toString());
    });

    it('should dedup duplicate imports, external modules, same var names', () => {
        const baseLocation = new Location('./path');
        const foo = createModule(baseLocation.relative('too/foo'));
        const bar = createModule('bar');
        const dupBar = createModule('bar');

        foo.import('bar', bar);
        // it should update a var ref of the affected import
        foo.import('bar', dupBar);
        Assert.equal(`const bar = require('bar');`, foo.toString());
        // now if we modify module name, both imports should be updated
        bar.location.root = 'bar-updated';
        Assert.equal(`const bar = require('bar-updated');`, foo.toString());
    });

    it('should dedup duplicate imports, relative module files', () => {
        const baseLocation = new Location('./path');
        const foo = createModule(baseLocation.relative('too/foo'));
        const bar = createModule(foo.relative('../other/deep/bar'));
        const dupBar = createModule(baseLocation.relative('too/other/deep/bar'));
        Assert.ok(bar === dupBar);

        foo.import('bar', bar);
        // it should update a var ref of the affected import
        const imp = foo.import('dupbar', dupBar);
        Assert.equal(`const bar = require('./other/deep/bar');const dupbar = require('./other/deep/bar');`,
            foo.toString());
        // now if we modify module name, both imports should be updated
        bar.location = bar.relative('deeper');
        Assert.equal(`const bar = require('./other/deep/bar/deeper');` +
            `const dupbar = require('./other/deep/bar/deeper');`, foo.toString());
        // try access other props
        imp[Symbol.iterator];
        imp.name = 'newBar';
        Assert.equal(`const bar = require('./other/deep/bar/deeper');` +
            `const newBar = require('./other/deep/bar/deeper');`, foo.toString());
        imp.value = 'boom'; // ignored
        Assert.equal(`const bar = require('./other/deep/bar/deeper');` +
            `const newBar = require('./other/deep/bar/deeper');`, foo.toString());
    });

    it('should dedup duplicate imports, relative module files, same var names', () => {
        const baseLocation = new Location('./path');
        const foo = createModule(baseLocation.relative('too/foo'));
        const bar = createModule(foo.relative('../other/deep/bar'));
        const dupBar = createModule(baseLocation.relative('too/other/deep/bar'));

        foo.import('bar', bar);
        // it should update a var ref of the affected import
        foo.import('bar', dupBar);
        Assert.equal(`const bar = require('./other/deep/bar');`, foo.toString());
    });

    it('should handle different imports with the same var name', () => {
        const one = createModule(new Location('./path'));
        const two = createModule('two');
        const three = createModule('three');

        one.import('bar', two);
        Assert.throws(() => {
            one.import('bar', three);
        }, /The var bar with the same name already defined in module .\/path/);
    });

    it('should fail to get relative from external module', () => {
        Assert.throws(() => {
            createModule('two').relative('path');
        }, /You cannot create relative path from external module two with relative path: path/);
    });
});
