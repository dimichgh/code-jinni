const Assert = require('assert');
const { Code } = require('./code');

class Var extends Code {
    constructor(name, value) {
        super();
        Assert.ok(value instanceof Code);
        // var name
        this.name = name;
        this.value = value;
    }

    toString() {
        return `const ${this.name} = ${this.value.toString()};`;
    }
}

module.exports = { Var };
