//
// calculate Sum
//

var environment = null;

var Sum = function (env) {
    environment = env;
};

Sum.prototype.work = function (inputs, outputs, state) {
    // console.log("do the work of Sum");
    var sum = 0.0;
    var num_missing = 0;
    var num_present = 0;
    var obj = Object.keys(inputs);
    for (var i = 0; i < obj.length; i++) {
        if (inputs[obj[i]] === undefined || inputs[obj[i]].trim() === "") {
            num_missing = num_missing + 1;
            continue;
        }
        num_present = num_present + 1;
        sum = sum + parseFloat(inputs[obj[i]]);
    }
    if (num_present > 0) {
        outputs['out'] = sum;
    }
    outputs['num_missing'] = num_missing;
    outputs['num_present'] = num_present;
    outputs['num_total']   = obj.length;
};

module.exports = Sum;
