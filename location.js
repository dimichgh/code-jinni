const Assert = require('assert');
const Path = require('path');

class Location {
    /**
     *
     * @param {Location} root provides a root for related locations
     * @param {String} path provides a relative path from the root
     */
    constructor(root) {
        this.root = root;
        this.path = '';
    }

    getPath() {
        if (this.root instanceof Location) {
            return Path.join(this.root.getPath(), this.path);
        }
        return this.root;
    }

    relative(path) {
        Assert.ok(path, 'Path must be provided');
        const ret = new Location(this);
        ret.path = path;
        return ret;
    }

    set(location) {
        this.root = location.root;
        this.path = location.path;
    }
}

module.exports = { Location };
