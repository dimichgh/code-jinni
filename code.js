const Assert = require('assert');
const Recast = require('recast');
const { Location } = require('./location');

class Code {
    constructor(snippet, location) {
        if (snippet instanceof Location) {
            location = snippet;
            snippet = undefined;
        }
        Assert.ok(!location || location instanceof Location);
        this.location = location;
        this.children = [];
        snippet !== undefined && this.add(String(snippet));
    }

    add(code) {
        Assert.ok(code instanceof Code || typeof code === 'string');
        if (code instanceof Code) {
            code.location = this.location;
        }
        this.children.push(code);

        return this;
    }

    getPath() {
        return this.location.getPath();
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
