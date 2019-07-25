//
// calculate SmallerEqual
//

var moment = require('moment');

var SmallerEqual = function (env) {
    // create this function only once, otherwise we think this nodes output changed
    this._condition = function(a,b) {
        var aAsDate = null;
        var bAsDate = null;        
        
	    var toString = Object.prototype.toString;
	    if ( toString.call(a) == '[object String]' ) {
            if (moment(a, "MM-DD-YYYY", true).isValid()) {
                aAsDate = moment(a, "MM-DD-YYYY", true);
                console.log("parsed " + a + " as a date " + aAsDate.format());
            }
            if (moment(a, 'YYYY-MM-DD', true).isValid()) {
                aAsDate = moment(a, 'YYYY-MM-DD', true);
                console.log("parsed " + a + " as a date " + aAsDate.format());
            }
            if (moment(a, 'YYYY-MM-DD HH:mm', true).isValid()) {
                aAsDate = moment(a, 'YYYY-MM-DD HH:mm', true);
                console.log("parsed " + a + " as a date " + aAsDate.format());
            }
	        a = parseFloat(a);
	    }
	    if ( toString.call(b) == '[object String]' ) {
            if (moment(b, "MM-DD-YYYY", true).isValid()) {
                bAsDate = moment(b, "MM-DD-YYYY", true);
                console.log("parsed " + b + " as a date " + bAsDate.format());
            }
            if (moment(b, 'YYYY-MM-DD', true).isValid()) {
                bAsDate = moment(b, 'YYYY-MM-DD', true);
                console.log("parsed " + b + " as a date " + bAsDate.format());
            }
            if (moment(b, 'YYYY-MM-DD HH:mm', true).isValid()) {
                bAsDate = moment(b, 'YYYY-MM-DD HH:mm', true);
                console.log("parsed " + b + " as a date " + bAsDate.format());
            }
	        b = parseFloat(b);
	    }
        if (aAsDate !== null && bAsDate !== null) {
            return aAsDate.isSameOrBefore(bAsDate);
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
