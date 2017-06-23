//
// calculate constant-number
//

var ConstantNumber = function (env) {

};

ConstantNumber.prototype.work = function (inputs, outputs, state) {
    //console.log("do the work of NOT");
    outputs['out'] = parseFloat(state[0]['value']);
};

module.exports = ConstantNumber;
