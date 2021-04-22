
// extends options object with default options
export function _default(options, def) {
    // check for undefined options
    options = options || {};

    // initialize new object
    var res = {};

    // iterate default properties
    Object.keys(def).forEach(function(key) {
        // if property == object, invoke function
        if (typeof options[key] == 'object'){
            res[key] = _default(options[key], def[key]);
        } else {
            // use options property if exists
            // otherwise, use default option
            res[key] = (options[key] == undefined) ? def[key] : options[key];
        }
    })

    // load options properties not included in default
    Object.keys(options).forEach(function(key) {
        res[key] = (res[key] == undefined) ? options[key] : res[key];
    })

    return res;
}
