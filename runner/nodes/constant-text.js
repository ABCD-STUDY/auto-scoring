//
// calculate constant-text
//
// The external connection wins over the internal state variable.
// The internal state variable will be trimmed (remove spaces from beginning and end).

var ConstantText = function (env) { };

ConstantText.prototype.work = function (inputs, outputs, state) {
    if (typeof state[0]['value'] !== 'undefined') {
        outputs['out'] = state[0]['value'].trim();
    }
    // or if there is an input use that one
    if (typeof inputs['in'] !== 'undefined') {
        outputs['out'] = inputs['in'];
    }
};

module.exports = ConstantText;
