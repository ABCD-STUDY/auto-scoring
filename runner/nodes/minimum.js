//
// calculate Minimum
//

var Minimum = function (env) {};

Minimum.prototype.work = function (inputs, outputs, state) {
    var num_missing = 0;
    var obj = Object.keys(inputs);
    var l = [];
    var min = null;
    for (var i = 0; i < obj.length; i++) {
        if (inputs[obj[i]] === "" || inputs[obj[i]] === undefined) {
            num_missing = num_missing + 1;
            continue;
        }
	if (min === null) {
	    min = parseFloat(inputs[obj[i]]);
        }
	if (min < parseFloat(inputs[obj[i]])) {
	    min = parseFloat(inputs[obj[i]]);
	}
    }
    if (min !== null)
        outputs['min'] = min;
    outputs['num_missing'] = num_missing;
    outputs['num_total']   = obj.length;
};

module.exports = Minimum;
