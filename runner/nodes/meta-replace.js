var fs   = require('fs')
var path = require('path')

var MetaReplace = function (p, master) {
    this._master = master;
    this._path = p;
    this._control = [];
    this._waitingForData = true;
};

MetaReplace.prototype.endEpoch = function () {
    // we should advance to the next entry here
    this._control.shift();
}

MetaReplace.prototype.doneDone = function () {
    if (this._waitingForData === true || this._control.length > 0) {
        return false; // still work to do in the next epoch
    }
    return true; // nothing more to do
}

MetaReplace.prototype.work = function (inputs, outputs, state) {
    var recipe  = state[0]['value'];
    
    // only the first time we will look inside the control structure, next iteration we will actually run this
    if (this._waitingForData && this._control !== []) {
        var control = JSON.parse(state[1]['value']);
        this._control = control;
        this._waitingForData = false;
        return;
    }

    var filename = path.join(this._path, "../viewer/recipes/", recipe + ".json");

    // look for this recipe, if you find it read and replace the information inside by the control structure
    if (fs.existsSync(filename)) {

	if (this._control.length == 0){
	    console.log("nothing more can be done");
	    return;
	}
	
        var recipe_code = JSON.parse(fs.readFileSync(filename, 'utf8'));
        var c = this._control[0]; // will advance to the next
        console.log("META-LEVEL instance " + this._control.length);
        var keys = Object.keys(c);
        for (var i = 0; i < keys.length; i++) {
            var n = keys[i];
            // n is the gui, but not yet the name of the icon
            var new_values = c[keys[i]];
            var nn = '';
            var ks = Object.keys(new_values);
            for (var l = 0; l < ks.length; l++) {
                nn = n + '-' + ks[l];
                var new_value2 = new_values[ks[l]];
                // find this key in the recipe_code and replace its 'value' with the value of the key
                var found = false
                for (var j = 0; j < recipe_code['nodes'].length; j++) {
                    var node = recipe_code['nodes'][j];
                    if (typeof node['state'] === 'undefined')
                        continue
                    for (var k = 0; k < node['state'].length; k++) {
                        var name = node['state'][k]['gid'] + "-" + node['state'][k]['name'];
                        if (nn === name) {
                            // ok, found the state variable, replace its value with the new value
                            node['state'][k]['value'] = new_value2;
                            found = true;
                            break;
                        }
                    }
                    if (found === true)
                        break;
                }
                if (found === false) {
                    console.log("Error: could not find the state variable: \"" + nn + "\"");
                    console.log("################################")
                    console.log("# -> skip this meta instance   #")
                    console.log("################################")
                } else {
                    console.log("Replace: \"" + nn + "\" with \"" + new_value2 + "\"");
                }
            }
        }
        // save new recipe as a temporary file
        var temp = require('temp').track();
        var tempName = temp.path({ suffix: '.recipe' });
        fs.writeFileSync(tempName, JSON.stringify(recipe_code));
        // run the runner in a sub-process
        require('child_process').execSync(require.main.filename + " run " + tempName, { stdio: [0, 1, 2] });
        console.log("DONE WITH ONE META STEP running: " + require.main.filename + " run " + tempName);
    }
};

module.exports = MetaReplace;
