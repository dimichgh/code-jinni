const Assert = require('assert');
const { Location } = require('../location');

describe(__filename, () => {
    it('should base location', () => {
        const base = new Location('path/to/root');
        Assert.equal('path/to/root', base.getPath());
    });

    it('should create relative location', () => {
        const base = new Location('path/to/root');
        Assert.equal('path/to', base.relative('..').getPath());
    });

    it('should mutate relative location based on base location change', () => {
        const base = new Location('path/to/root');
        const foo = base.relative('../foo');
        const bar = base.relative('../other/deep/bar');
        Assert.equal('path/to/foo', foo.getPath());
        Assert.equal('path/to/other/deep/bar', bar.getPath());

        base.root = 'new/root';
        Assert.equal('new/foo', foo.getPath());
        Assert.equal('new/other/deep/bar', bar.getPath());
    });
});
