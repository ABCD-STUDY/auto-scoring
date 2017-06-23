//
// calculate Median
//

var Median = function (env) {};

Median.prototype.work = function (inputs, outputs, state) {
    var num_missing = 0;
    var num_present = 0;
    var obj = Object.keys(inputs);
    var l = [];
    for (var i = 0; i < obj.length; i++) {
        if (inputs[obj[i]] === "" || inputs[obj[i]] === undefined) {
            num_missing = num_missing + 1;
            continue;
        }
        num_present = num_present + 1;
        l.push(parseFloat(inputs[obj[i]]));
    }
    l = l.sort();
    if (num_present > 0) {
	var idx = l.length / 2.0;
        if (l.length % 2 === 0) {
	    // divisible by 2
	    outputs['out'] = (l[idx] + l[idx+1]) / 2.0;
	} else {
            outputs['out'] = l[idx];
	}
    }
    outputs['num_missing'] = num_missing;
    outputs['num_total']   = obj.length;
};

module.exports = Median;
