//
// calculate All-Not-Empty
//

var environment = null;

var AllNotEmpty = function (env) {
    environment = env;
};

AllNotEmpty.prototype.work = function (inputs, outputs, state) {
    // console.log("do the work of AllNotEmpty");
    var obj = Object.keys(inputs);
    for (var i = 0; i < obj.length; i++) {
        if (inputs[obj[i]] === "" || inputs[obj[i]] === undefined) {
            outputs['true'] = 1;
            outputs['false'] = 0;
            return;
        }
    }
    outputs['true'] = 0;
    outputs['false'] = 1;
};

module.exports = AllNotEmpty;
