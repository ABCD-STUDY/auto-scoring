//
// calculate constant-number
//


var ConstantText = function (env) { };

ConstantText.prototype.work = function (inputs, outputs, state) {
    // walk through the state and copy to the output
    outputs['out'] = state[0]['value'];
};

module.exports = ConstantText;
