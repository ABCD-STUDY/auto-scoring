//
// calculate Mean
//

var environment = null;

var Mean = function (env) {
    environment = env;
};

Mean.prototype.work = function (inputs, outputs, state) {
    var sum = 0.0;
    var num_missing = 0;
    var num_present = 0;
    var obj = Object.keys(inputs);
    for (var i = 0; i < obj.length; i++) {
        //console.log("INPUTS IS : " + JSON.stringify(inputs[obj[i]]));
        if (inputs[obj[i]] === undefined || (inputs[obj[i]]+"").trim() === "") {
            num_missing = num_missing + 1;
            continue;
        }
        num_present = num_present + 1;
        sum = sum + parseFloat(inputs[obj[i]]);
    }
    if (num_present > 0) {
        outputs['out'] = sum / num_present;
    }
    outputs['num_missing'] = num_missing;
    outputs['num_present'] = num_present;
    outputs['num_total']   = obj.length;
};

module.exports = Mean;
