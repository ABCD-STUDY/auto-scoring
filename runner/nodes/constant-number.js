//
// calculate constant-number
//

var ConstantNumber = function (env) { };

ConstantNumber.prototype.work = function (inputs, outputs, state) {
    outputs['out'] = parseFloat(state[0]['value']);

    // or if there is an input use that one
    if (typeof inputs['in'] !== 'undefined') {
	outputs['out'] = parseFloat(inputs['in']);
    }
};

module.exports = ConstantNumber;
