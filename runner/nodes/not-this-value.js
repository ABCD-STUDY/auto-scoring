//
// calculate Not-This-Value
//

var NotThisValue = function (env) {};

NotThisValue.prototype.work = function (inputs, outputs, state) {
    var refuse = state[0]['value'];
    var obj = Object.keys(inputs);
    for (var i = 0; i < obj.length; i++) {
        if (inputs[obj[i]] === "" || inputs[obj[i]] === undefined || inputs[obj[i]] === refuse) {
            outputs['true'] = 0;
            outputs['false'] = 1;
            return;
        }
    }
    outputs['true'] = 1;
    outputs['false'] = 0;
};

module.exports = NotThisValue;
