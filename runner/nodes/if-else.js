//
// calculate If-else
//

var IfElse = function (env) {
    environment = env;
    // create this function only once, otherwise we think this nodes output changed
};

IfElse.prototype.work = function (inputs, outputs, state) {
    // console.log("do the work of equal");
    // we should return a function for two arguments that if can run for us
    var a = null; // a value
    var b = null; // a value
    var condition = null; // a function
    // do we have a value from the state of this node?
    if (typeof state[0]['value'] !== 'undefined') {
        a = state[0]['value'];
    }
    if (typeof state[1]['value'] !== 'undefined') {
        b = state[1]['value'];
    }
    // if we have a connection (input) instead use that one - not the internal state
    if (typeof inputs['condition'] !== 'undefined') {
        condition = inputs['condition'];
    }
    if (typeof inputs['b'] !== 'undefined') {
        b = inputs['b'];
    }
    if (typeof inputs['a'] !== 'undefined') {
        a = inputs['a'];
    }

    if (condition === null || typeof condition == 'undefined') {
        // don't allow anything
	outputs['true'] = 0;
	outputs['false'] = 0; // both are false
        return;
    }

    var res = condition(a, b)
    if (res) {
        outputs['true'] = 1;
        outputs['false'] = 0;
        return;
    }
    outputs['true'] = 0;
    outputs['false'] = 1;
};

module.exports = IfElse;
