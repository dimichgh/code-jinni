const Assert = require('assert');
const { Code } = require('./code');

class Var extends Code {
    constructor(name, value, type = 'const') {
        super();
        Assert.ok(value === undefined || value instanceof Code);
        // var name
        this.name = name;
        this.value = value;
        this.type = type;
    }

    toString() {
        if (this.value === undefined) {
            return `let ${this.name};`;
        }
        return `${this.type} ${this.name} = ${this.value.toString()};`;
    }
}

module.exports = { Var };
