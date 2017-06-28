//
// calculate Maximum
//

var Maximum = function (env) {};

Maximum.prototype.work = function (inputs, outputs, state) {
    var num_missing = 0;
    var obj = Object.keys(inputs);
    var l = [];
    var max = null;
    for (var i = 0; i < obj.length; i++) {
        if (inputs[obj[i]] === "" || inputs[obj[i]] === undefined) {
            num_missing = num_missing + 1;
            continue;
        }
	if (max === null) {
	    max = parseFloat(inputs[obj[i]]);
        }
	if (max < parseFloat(inputs[obj[i]])) {
	    max = parseFloat(inputs[obj[i]]);
	}
    }
    if (max !== null)
        outputs['max'] = max;
    outputs['num_missing'] = num_missing;
    outputs['num_total']   = obj.length;
};

module.exports = Maximum;
