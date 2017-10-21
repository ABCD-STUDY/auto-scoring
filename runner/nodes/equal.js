//
// calculate Equal
//

var environment = null;

var Equal = function (env) {
    // create this function only once, otherwise we think this nodes output changed
    this._condition = function(a,b) {
        // what if a, b are strings or numbers? 
        // If both are strings compare as string
        if (typeof a == 'string' && typeof b == 'string') {
	    //console.log(" -> a: " + a + " b: " + b + " result: " + (a == b));
            return a == b;
        }

        // if one is number convert the other to number as well
        if (typeof a == 'number' && typeof b == 'string') {
            b = parseInt(b); // parseInt(b)
        }
        if (typeof b == 'number' && typeof a == 'string') {
            a = parseInt(a);
        }
	//console.log(" -> a: " + a + " b: " + b + " result: " + (a === b));
        return a === b; // do we need to do === ?
    };
};

Equal.prototype.work = function (inputs, outputs, state) {
    // console.log("do the work of equal");
    // we should return a function for two arguments that if can run for us
    outputs['out'] = this._condition;
};

module.exports = Equal;
