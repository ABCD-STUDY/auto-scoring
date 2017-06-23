//
// calculate Equal
//

var environment = null;

var Equal = function (env) {
    // create this function only once, otherwise we think this nodes output changed
    this._condition = function(a,b) { return a == b; };
};

Equal.prototype.work = function (inputs, outputs, state) {
    // console.log("do the work of equal");
    // we should return a function for two arguments that if can run for us
    outputs['out'] = this._condition;
};

module.exports = Equal;
