//
// calculate All-Not-Empty
//

var AllNotEmpty = function (env) {};

AllNotEmpty.prototype.work = function (inputs, outputs, state) {
    // console.log("do the work of AllNotEmpty");
    var obj = Object.keys(inputs);
    for (var i = 0; i < obj.length; i++) {
        if (inputs[obj[i]] === "" || inputs[obj[i]] === undefined) {
            outputs['true'] = 0;
            outputs['false'] = 1;
            return;
        }
    }
    outputs['true'] = 1;
    outputs['false'] = 0;
};

module.exports = AllNotEmpty;
