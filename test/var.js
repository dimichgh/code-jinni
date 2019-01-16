const Assert = require('assert');
const { Code } = require('../code');
const { Var } = require('../var');

describe(__filename, () => {
    it('should simple var', () => {
        const val = new Var('foo', new Code(`'bar'`));
        Assert.equal(`const foo = 'bar';`, val.toString());
    });

    it('should number var', () => {
        const val = new Var('foo', new Code(10));
        Assert.equal(`const foo = 10;`, val.toString());
    });

    it('should number var, default toString', () => {
        const val = new Var('foo', new Code(10));
        Assert.equal(`const foo = 10;`, `${val}`);
    });
});
