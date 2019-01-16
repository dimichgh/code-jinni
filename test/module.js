const Assert = require('assert');
const { Module } = require('../module');
const { Location } = require('../location');

describe(__filename, () => {
    it('should create an empty module', () => {
        const code = new Module('foo', new Location('path/to/root'));
        Assert.equal('', code.toString());
    });

    it('should create a simple module', () => {
        const code = new Module('foo', new Location('path/to/root'));
        code.add('body');
        Assert.equal('body', code.toString());
    });

    it('should add import relative', () => {
        const foo = new Module('foo', new Location('./path/to/foo'));
        const bar = new Module('bar', new Location('./path/to/bar'));
        foo.add('body');
        foo.import('bar', bar);
        Assert.equal(`const bar = require('./bar');body`, foo.toString());
    });

    it('should add import of external module', () => {
        const foo = new Module('foo', new Location('./path/to/foo'));
        Assert.ok(!foo.external);
        const bar = new Module('bar');
        Assert.ok(bar.external);
        foo.add('body');
        foo.import('bar', bar);
        Assert.equal(`const bar = require('bar');body`, foo.toString());
    });

    it('should add multiple imports', () => {
        const foo = new Module('foo', new Location('./path/to/foo'));
        const bar = new Module('bar');
        const qaz = new Module('qaz');
        const wsx = new Module('wsx', new Location('path/other/wsx'));
        foo.add('body');
        foo.import('bar', bar);
        foo.import('qaz', qaz);
        foo.import('wsx', wsx);
        Assert.equal(`const bar = require('bar');const qaz = ` +
        `require('qaz');const wsx = require('../other/wsx');body`, foo.toString());
    });

    it('should not allow to get content for external module', () => {
        const bar = new Module('bar');
        Assert.ok(bar.external);
        Assert.throws(() => {
            bar.toString();
        }, /You cannot serialize external module bar/);
    });

    it('should not allow to get content for external module', () => {
        const bar = new Module('bar');
        Assert.ok(bar.external);
        Assert.throws(() => {
            bar.import('foo', new Module('foo'));
        }, /You cannot add import to external module bar/);
    });

    it('should modify imports when base changes for one', () => {
        const baseLocation = new Location('./path');
        const foo = new Module('foo', baseLocation.relative('too/foo'));
        const bar = new Module('bar');
        const qaz = new Module('qaz');
        const wsx = new Module('wsx', new Location('path/other/wsx'));
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
});
