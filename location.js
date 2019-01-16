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
        const ret = new Location(this);
        ret.path = path;
        return ret;
    }
}

module.exports = { Location };
