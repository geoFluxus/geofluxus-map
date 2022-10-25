
// extends options object with default options
export function _default(options, def) {
    // check for undefined options
    options = options || {};

    // initialize new object
    var res = {};

    // iterate default properties
    Object.keys(def).forEach(function(key) {
        // if property == Array, load it
        if (Array.isArray(options[key])) {
            res[key] = options[key];
        }
        // if property == object, invoke function
        else if (typeof options[key] == 'object') {
            res[key] = _default(options[key], def[key]);
        }
        else {
            // load options property if exists
            // otherwise, load default option
            res[key] = (options[key] == undefined) ? def[key] : options[key];
        }
    })

    // load options properties not included in default
    Object.keys(options).forEach(function(key) {
        res[key] = (res[key] == undefined) ? options[key] : res[key];
    })

    return res;
}


// https://stackoverflow.com/questions/14484787/wrap-text-in-javascript
export function wrapText(str, width, spaceReplacer) {
  if (str.length > width) {
    let p = width;
    while (p > 0 && str[p] != ' ' && str[p] != '-') {
      p--;
    }
    if (p > 0) {
      let left;
      if (str.substring(p, p + 1) == '-') {
        left = str.substring(0, p + 1);
      } else {
        left = str.substring(0, p);
      }
      const right = str.substring(p + 1);
      return left + spaceReplacer + wrapText(right, width, spaceReplacer);
    }
  }
  return str;
}
