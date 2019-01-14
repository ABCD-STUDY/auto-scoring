//
// calculate Rcode module
//

var Rcode = function (env) {};
var path = require('path');
var fs = require('fs');

// delete the directory to safe space
Rcode.prototype.rimraf = function (dir_path) {
    if (fs.existsSync(dir_path)) {
        fs.readdirSync(dir_path).forEach(function(entry) {
            var entry_path = path.join(dir_path, entry);
            if (fs.lstatSync(entry_path).isDirectory()) {
                rimraf(entry_path);
            } else {
                fs.unlinkSync(entry_path);
            }
        });
        fs.rmdirSync(dir_path);
    }
};

Rcode.prototype.work = function (inputs, outputs, state) {
	var source = "";
	for (var j = 0; j < state.length; j++) {
		if (state[j]['name'] == 'source') {
            if (typeof state[j]['value'] === 'undefined') {
                console.log("Warning: no value entry found in " + JSON.stringify(state));
			    continue; // nothing to do here
            } else {
                source = state[j]['value'];
                break;
            }
        }
	}
    if (source != "") {
        // lets run in a temp directory, directory is deleted after this loop
        var tmp = require('tmp');
        var fs  = require('fs');
        var exec = require('child_process');
        
        var tmpDir = tmp.dirSync({ prefix: 'runner_rcode', keep: false });
        tmpDir = tmpDir.name;
        //console.log("create tmp directory: " + tmpDir);
        
        // save the inputs
        //console.log("inputs: " + JSON.stringify(inputs));
        fs.writeFileSync(tmpDir+'/inputs.json', JSON.stringify(inputs));
        fs.writeFileSync(tmpDir+'/outputs.json', JSON.stringify(outputs));
        
        // now run the R-code
        var code = "# read the input\n";
        code += "library('rjson')\n";
        code += "inputs = fromJSON(file=\"" + tmpDir + "/inputs.json\")\n";
        code += "outputs = fromJSON(file=\"" + tmpDir + "/outputs.json\")\n";
        code += source;
        code += "\n# save the output\n";
        code += "sink(\"" + tmpDir + "/outputs_out.json\")\n";
        code += "cat(toJSON(outputs))\n";
        code += "sink()\n";
        fs.writeFileSync(tmpDir+'/code.R', code);

        var stdout = exec.execSync('/usr/bin/Rscript ' + tmpDir + '/code.R');
        //console.log("Info: \"\n" + stdout + "\"\n\n");
        
        // read the outputs
        if (!fs.existsSync(tmpDir + "/outputs_out.json")) {
            console.error("Error: outputs.json was not created in " + tmpDir);
        } else {
            // read the outputs in
            var data = JSON.parse(fs.readFileSync(tmpDir + "/outputs_out.json"));
            //console.log("outputs_out: " + JSON.stringify(data));
            // assign to outputs
	        var obj = Object.keys(data);
	        for (var i = 0; i < obj.length; i++) {
                outputs[obj[i]] = data[obj[i]];
	        }
            //console.log("Got back these values: " + JSON.stringify(outputs) + "\n");
        }
        // and delete the directory again
        this.rimraf(tmpDir);
    }
};

module.exports = Rcode;
