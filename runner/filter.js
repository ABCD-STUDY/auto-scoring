//
// calculate Filter
//

var Filter = function (env) { };

Filter.prototype.work = function (inputs, outputs, state) {
    var obj = Object.keys(inputs);
    for (var i = 0; i < obj.length; i++) {
	if (typeof state['value'] !== 'undefined' && inputs[obj[i]] === state['value']) {
	    var repl = "";
	    if (typeof state['replacement'] !== 'undefined') {
		repl = state['replacement'];
	    }
	    outputs[obj[i]] = state['replacement'];
	} else {
	    outputs[obj[i]] = inputs[obj[i]];
	}
    }
};

module.exports = Filter;
