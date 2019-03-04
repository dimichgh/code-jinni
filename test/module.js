const Assert = require('assert');
const { createModule, ModuleLocation } = require('../module');
const { Location } = require('../location');

describe(__filename, () => {
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

    it('should use strict', () => {
        const foo = createModule(new Location('./path/to/foo'));
        foo.useStrict();
        Assert.ok(!foo.external);
        const bar = createModule('bar');
        Assert.ok(bar.external);
        foo.add('body');
        foo.import('bar', bar);
        Assert.equal(`'use strict';const bar = require('bar');body`, foo.toString());
    });

    it('should create return module location for external modules', () => {
        const foo = createModule('foo');
        Assert.ok(foo.relative('..') instanceof ModuleLocation);

        const bar = createModule(new Location('./path/to/bar'));
        Assert.ok(!(bar.relative('..') instanceof ModuleLocation));
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

    it('should unref some imported modules', () => {
        const base = new Location('./path/to/foo');
        const foo = createModule(base);
        const bar = createModule('bar');
        const qaz = createModule('qaz');
        const wsx = createModule(new Location('path/other/wsx'));
        foo.add('body');
        foo.import('bar', bar);
        foo.import('bar', bar);
        const qazImp = foo.import('qaz', qaz).unref();
        const wsxImp = foo.import('wsx', wsx).unref();
        Assert.equal(`const bar = require('bar');body`, foo.toString());
        Assert.equal(`const qaz = require('qaz');`, qazImp.toString());
        Assert.equal(`const wsx = require('../other/wsx');`, wsxImp.toString());
        // should affect module location change even for unref imports
        base.root = 'some/other/path';
        Assert.equal(`const bar = require('bar');body`, foo.toString());
        Assert.equal(`const qaz = require('qaz');`, qazImp.toString());
        Assert.equal(`const wsx = require('../../path/other/wsx');`, wsxImp.toString());
    });

    it('should inline some imported modules', () => {
        const base = new Location('./path/to/foo');
        const foo = createModule(base);
        const bar = createModule('bar');
        const qaz = createModule('qaz');
        const wsx = createModule(new Location('path/other/wsx'));
        foo.add('body;');
        foo.import('bar', bar);
        foo.add(foo.import('qaz', qaz).inline());
        foo.add(foo.import('wsx', wsx).inline());
        Assert.equal(`const bar = require('bar');let qaz;let wsx;body;qaz` +
            ` = require('qaz');wsx = require('../other/wsx');`, foo.toString());
        // should affect module location change even for unref imports
        base.root = 'some/other/path';
        Assert.equal(`const bar = require('bar');let qaz;let wsx;body;qaz` +
            ` = require('qaz');wsx = require('../../path/other/wsx');`, foo.toString());
    });

    it('should not allow to get content for external module', () => {
        const bar = createModule('bar');
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
        Assert.equal('two/path', createModule('two').relative('path').getPath());
    });
});
