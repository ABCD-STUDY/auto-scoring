//
// calculate Filter
//

var Filter = function (env) { };

Filter.prototype.work = function (inputs, outputs, state) {
	var repl = undefined;
	var valu = undefined;
	for (var j = 0; j < state.length; j++) {
		if (typeof state[j]['value'] === 'undefined')
			continue;
		if (state[j]['name'] == "replacement")
			repl = state[j]['value'];
		if (state[j]['name'] == "value")
			valu = state[j]['value'];
	}

	var obj = Object.keys(inputs);
	for (var i = 0; i < obj.length; i++) {
		// we don't know which state has the value and which has the replacement
		if (valu === inputs[obj[i]]) {
			outputs[obj[i]] = repl;
		} else {
			outputs[obj[i]] = inputs[obj[i]];			
		}
	}
};

module.exports = Filter;
