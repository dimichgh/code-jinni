const Assert = require('assert');
const Recast = require('recast');
class Code {
    constructor(snippet, parent) {
        this.children = [];
        snippet !== undefined && this.add(String(snippet));
        this.parent = parent;
    }

    add(code) {
        Assert.ok(code instanceof Code || typeof code === 'string');
        if (code instanceof Code) {
            code.parent = this;
        }
        this.children.push(code);

        return this;
    }

    toString() {
        return this.children.map(code => code.toString()).join('');
    }

    static pretty(code, tabWidth = 4) {
        const ast = Recast.parse(code.toString());
        return Recast.prettyPrint(ast, { tabWidth }).code;
    }
}

module.exports = { Code };
