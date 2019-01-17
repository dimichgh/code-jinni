const Assert = require('assert');
const Path = require('path');
const relative = require('relative');
const { Location } = require('./location');
const { Code } = require('./code');
const { Var } = require('./var');

let allModules = [];

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
    constructor(location) {
        super();
        this.location = typeof location === 'string' ? new ModuleLocation(location) : location;
        this.external = typeof location === 'string';
        this.imports = [];
    }

    static create(location) {
        const newMod = new Module(location);
        const existingModule = allModules.find(mod => mod.getPath() === newMod.getPath());
        if (existingModule) {
            return existingModule;
        }
        allModules.push(newMod);
        return newMod;
    }

    import(name, mod) {
        Assert.ok(!this.external, `You cannot add import to external module ${this.getPath()}`);
        Assert.ok(mod instanceof Module);

        let imp = new Import(name, this, mod);
        // check if we have dup imports or var name conflicts
        const existingImp = this.imports.find(im => im.value.toString() === imp.value.toString());
        if (existingImp) {
            if (existingImp.name === name) {
                return existingImp;
            }
            // create a reference to the existing import
            imp = new Proxy({
                name
            }, {
                get(target, prop) {
                    if (typeof prop === 'string') {
                        return target.hasOwnProperty(prop) ? target[prop] : existingImp[prop];
                    }
                    return target[prop];
                },

                set(target, prop, value) {
                    if (typeof prop === 'string' && target.hasOwnProperty(prop)) {
                        target[prop] = value;
                    }
                    // change is not allowed for other properties
                }
            });
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
        return `${this.imports.map(imp => imp.toString()).join('')}${super.toString()}`;
    }

    relative(path) {
        Assert.ok(!this.external, `You cannot create relative path from external module ${
            this.getPath()} with relative path: ${path}`);
        return this.location.relative(path);
    }
}

module.exports = {
    createModule: Module.create,
    cache: {
        clear() {
            allModules = [];
        }
    }
};
