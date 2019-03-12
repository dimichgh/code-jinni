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
        this.reference = this.value;
    }

    unref() {
        const pos = this.value.hostCodeRef.imports.indexOf(this);
        this.value.hostCodeRef.imports.splice(pos, 1);
        return this;
    }

    inline() {
        const pos = this.value.hostCodeRef.imports.indexOf(this);
        const varDecl = new Var(this.name);
        varDecl.reference = this.value;
        varDecl.inline = () => this;
        this.value.hostCodeRef.imports.splice(pos, 1, varDecl);
        this.isInline = true;
        return this;
    }

    toString() {
        if (this.isInline) {
            return `${this.name} = ${this.name} || ${this.value.toString()};`;
        }
        return super.toString();
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

    relative(path) {
        Assert.ok(path, 'path must be provided');
        const ret = new ModuleLocation(this);
        ret.path = path;
        return ret;
    }
}

class Module extends Code {
    constructor(location) {
        super();
        this.location = typeof location === 'string' ? new ModuleLocation(location) : location;
        this.imports = [];
    }

    get external() {
        let location = this.location;
        while (location instanceof Location) {
            if (location instanceof ModuleLocation) {
                return true;
            }
            location = location.root;
        }
        return false;
    }

    static create(location) {
        const newMod = new Module(location);
        return newMod;
    }

    useStrict() {
        this.strict = true;
    }

    import(name, mod) {
        Assert.ok(!this.external, `You cannot add import to external module ${this.getPath()}`);
        Assert.ok(mod instanceof Module);

        const imp = new Import(name, this, mod);
        // check if we have dup imports or var name conflicts
        const existingImp = this.imports.find(im => String(im.reference) === String(imp.reference));
        if (existingImp) {
            return existingImp;
        }
        // now check if we have var name cpnflict
        const nameConflictImp = this.imports.find(im => im.name === imp.name);
        if (nameConflictImp) {
            throw new Error(`The var ${name} with the same name already defined in module ${this.getPath()}`);
        }
        this.imports.push(imp);
        return imp;
    }

    getPath() {
        return this.location.getPath();
    }

    toString() {
        Assert.ok(!this.external, `You cannot serialize external module ${this.getPath()}`);
        return `${this.strict ?
            `'use strict';` : ''}${this.imports.map(imp => imp.toString()).join('')}${super.toString()}`;
    }

    relative(path) {
        return this.location.relative(path);
    }
}

module.exports = {
    createModule: Module.create,
    ModuleLocation
};
