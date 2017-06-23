//
// calculate NOT
//

var environment = null;

var Not = function (env) {
    environment = env;
    this._condition = function(a) { return !(a); };
};

Not.prototype.work = function (inputs, outputs, state) {
    //console.log("do the work of NOT");
    outputs['out'] = this._condition;
};

module.exports = Not;
