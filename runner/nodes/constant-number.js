//
// calculate constant-number
//
// Problem might be that float values cannot easily be compared with
// each other. We would check in the runner and use some 1e-6 to compare
// two floats with each other.

var ConstantNumber = function (env) { };

ConstantNumber.prototype.work = function (inputs, outputs, state) {
    if (typeof state[0]['value'] !== 'undefined') {
	outputs['out'] = parseFloat(state[0]['value'].trim());
    }

    // or if there is an input use that one
    if (typeof inputs['in'] !== 'undefined') {
	outputs['out'] = parseFloat(inputs['in']);
    }
};

module.exports = ConstantNumber;
