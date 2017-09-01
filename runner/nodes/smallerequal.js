//
// calculate SmallerEqual
//

var SmallerEqual = function (env) {
    // create this function only once, otherwise we think this nodes output changed
    this._condition = function(a,b) {
	var toString = Object.prototype.toString;
	if ( toString.call(a) == '[object String]' ) {
	    a = parseFloat(a);
	}
	if ( toString.call(b) == '[object String]' ) {
	    b = parseFloat(b);
	}
	return a <= b;
    };
};

SmallerEqual.prototype.work = function (inputs, outputs, state) {
    // console.log("do the work of equal");
    // we should return a function for two arguments that if can run for us
    outputs['out'] = this._condition;
};

module.exports = SmallerEqual;
