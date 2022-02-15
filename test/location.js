const Assert = require('assert');
const { Location } = require('../location');
const Path = require('path');

describe(__filename, () => {
    it('should base location', () => {
        const base = new Location('path/to/root');
        Assert.equal(`path/to/root`, base.getPath());
    });

    it('should create relative location', () => {
        const base = new Location('path/to/root');
        Assert.equal(`path${Path.sep}to`, base.relative('..').getPath());
    });

    it('should mutate relative location based on base location change', () => {
        const base = new Location('path/to/root');
        const foo = base.relative('../foo');
        const bar = base.relative('../other/deep/bar');
        Assert.equal(`path${Path.sep}to${Path.sep}foo`, foo.getPath());
        Assert.equal(`path${Path.sep}to${Path.sep}other${Path.sep}deep${Path.sep}bar`, bar.getPath());

        base.root = 'new/root';
        Assert.equal(`new${Path.sep}foo`, foo.getPath());
        Assert.equal(`new${Path.sep}other${Path.sep}deep${Path.sep}bar`, bar.getPath());

        base.set(new Location('new/path').relative('..'));
        Assert.equal(`other${Path.sep}deep${Path.sep}bar`, bar.getPath());
        Assert.equal('foo', foo.getPath());
    });
});
