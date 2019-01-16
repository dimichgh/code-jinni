const Assert = require('assert');
const Path = require('path');
const relative = require('relative');
const { Location } = require('./location');
const { Code } = require('./code');
const { Var } = require('./var');

class Link extends Code {
    constructor(hostCodeRef, importedCodeRef) {
        super();
        Assert.ok(hostCodeRef instanceof Module);
        Assert.ok(importedCodeRef instanceof Module);

        this.hostCodeRef = hostCodeRef;
        this.importedCodeRef = importedCodeRef;
    }

    toString() {
        if (this.importedCodeRef.external) {
            return `require('${this.importedCodeRef.getPath()}')`;
        }
        const path = relative(Path.resolve(this.hostCodeRef.getPath(), '..'),
            this.importedCodeRef.getPath());

        return `require('${/\./.test(path) ? path : `./${path}`}')`;
    }
}

class Import extends Var {
    constructor(name, hostCode, importedCode) {
        super(name, new Link(hostCode, importedCode));
    }
}

class ModuleLocation extends Location {
    /**
     * @param {Location} root provides a root for related locations
     * @param {String} path provides a relative path from the root
     */
    constructor(name) {
        super(name);
        Assert.ok(name);
    }
}

class Module extends Code {
    constructor(name, location) {
        super(location || new ModuleLocation(name));
        this.name = name;
        this.external = !location;
        this.imports = [];
    }

    import(name, mod) {
        Assert.ok(!this.external, `You cannot add import to external module ${this.getPath()}`);
        Assert.ok(mod instanceof Module);
        const imp = new Import(name, this, mod);
        this.imports.push(imp);
        return imp;
    }

    toString() {
        Assert.ok(!this.external, `You cannot serialize external module ${this.getPath()}`);
        return `${this.imports.map(imp => imp.toString()).join('')}${super.toString()}`;
    }
}

module.exports = { Module };
