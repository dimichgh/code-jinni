const Assert = require('assert');
const { Code } = require('../code');
const { Location } = require('../location');

describe(__filename, () => {
    it('should create an empty snippet code', () => {
        const code = new Code();
        Assert.equal('', code.toString());
    });

    it('should create string snippet code', () => {
        const code = new Code('snippet');
        Assert.equal('snippet', code.toString());
    });

    it('should create string snippet code with children', () => {
        const code = new Code();
        code.add('one');
        code.add('two');
        Assert.equal('onetwo', code.toString());
    });

    it('should create string snippet code with code as children', () => {
        const code = new Code();
        code.add('one');
        code.add(new Code('body'));
        code.add('two');
        Assert.equal('onebodytwo', code.toString());
    });

    it('should create code dom tree', () => {
        const code = new Code();
        code.add('head');
        code.add(new Code('body').add(new Code('one').add('two')).add('three'));
        code.add('tail');
        Assert.equal('headbodyonetwothreetail', code.toString());
    });

    it('should create string snippet code with location', () => {
        const code = new Code(new Location('path/to/file'));
        code.add('one');
        code.add(new Code('body'));
        code.add('two');
        Assert.equal('onebodytwo', code.toString());
        Assert.equal('path/to/file', code.getPath());
    });

    it('should prettyprint js code', () => {
        Assert.equal('function fn() {\n    return "foo";\n}', Code.pretty(new Code(`function fn() { return 'foo' }`)));
    });
});
