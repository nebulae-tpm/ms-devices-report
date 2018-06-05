class ObjectTools {
    static clean(obj) {
        var propNames = Object.getOwnPropertyNames(obj);
        for (var i = 0; i < propNames.length; i++) {
            var propName = propNames[i];
            if (obj[propName] === undefined) {
                delete obj[propName];
            }
        }
    }

    static isObject(a) {
        return (!!a) && (a.constructor === Object);
    }

    static isArray(a) {
        return (!!a) && (a.constructor === Array);
    }

    static isEmptyObject(obj) {
        return !Object.keys(obj).length;
    }
}


module.exports = ObjectTools;