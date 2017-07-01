#!/usr/bin/env nodejs

//#!/usr/bin/env node

// run this with:
//   ./runner.js run -i ../viewer/recipes/FirstTest.json

'use strict';

const program = require('commander');
var request = require('request');
var fs = require('fs');
var path = require('path');

var Not         = require("./not.js")
var Equal       = require("./equal.js")
var RedcapGet   = require("./redcap_get.js")
var RedcapPut   = require("./redcap_put.js")
var Mean        = require("./mean.js")
var Median      = require("./median.js")
var Sum         = require("./sum.js")
var AllNotEmpty = require("./all-not-empty.js")
var NotThisValue = require("./not-this-value.js")
var ConsoleOut  = require("./console-out.js")
var IfElse      = require("./if-else.js")
var ConstantNumber = require("./constant-number.js")
var ConstantText = require("./constant-text.js")
var SmallerEqual = require("./smallerequal.js")
var GreaterEqual = require("./greaterequal.js")
var Maximum      = require("./maximum.js")
var Minimum      = require("./minimum.js")
var Filter       = require("./filter.js")

var exportFileName = "";

// return the values for a node from the incoming connections (each incoming connections source nodes internal state value)
function getInputValues(n, recipe) {
    var inputs = {};
    var nodes = recipe['nodes'];
    var connections = recipe['connections'];

    for (var inp = 0; inp < n['inputs'].length; inp++) {        // for each input of this node
        var thisinput = n['inputs'][inp];
        var thisinputName = thisinput['name'];
        var id = thisinput['id'];
        for (var i = 0; i < connections.length; i++) {   	// find this inputs connections
            if (connections[i]['target'].indexOf(id) !== -1) {  // found one connection that leads to this node (inputs have to be singeltons? Or can we have more than one input and we pick a random value?)
                // what is the node on the other end of the connection? This node is the target.
                var targetNodeID = connections[i]['source'];
                var targetNode = null;
                var outputPort = null;
                for (var j = 0; j < nodes.length; j++) {
                    for (var k = 0; k < nodes[j]['outputs'].length; k++) {
                        if (targetNodeID.indexOf(nodes[j]['outputs'][k]['id']) !== -1) {
                            // found the target node
                            targetNode = nodes[j];
                            outputPort = k;
                            break;
                        }
                    }
                    if (targetNode !== null) {
                        break;
                    }
                }
                if (targetNode !== null) {
                    // ok, this is the node on the other end. What is the state value for this output port?
                    var value = undefined;
                    if (typeof targetNode['outputs'] !== 'undefined') {
                        // value = targetNode['state'][outputPort]['value'];  // this is the internal value, not the calculated one
                        if (typeof targetNode['outputs'][outputPort]['value'] !== 'undefined')
                            value = targetNode['outputs'][outputPort]['value'];
                    }

                    // add to inputs
                    // for undefined this would indicate that a value was expected - but could not be set by the recipe at this point in time
                    inputs[thisinputName] = value;
                }
            }
        }
    }
    return inputs;
}

function getEnabledValue(n, recipe) {
    var enabled = true;
    var nodes = recipe['nodes'];
    var connections = recipe['connections'];

    var id = n['enabledisable-id'];
    for (var i = 0; i < connections.length; i++) {   	// find this inputs connections
        if (connections[i]['target'].indexOf(id) !== -1) {  // found one connection that leads to this node (inputs have to be singeltons? Or can we have more than one input and we pick a random value?)
            // what is the node on the other end of the connection? This node is the target.
            var targetNodeID = connections[i]['source'];
            var targetNode = null;
            var outputPort = null;
            for (var j = 0; j < nodes.length; j++) {
                for (var k = 0; k < nodes[j]['outputs'].length; k++) {
                    if (targetNodeID.indexOf(nodes[j]['outputs'][k]['id']) !== -1) {
                        // found the target node
                        targetNode = nodes[j];
                        outputPort = k;
                        break;
                    }
                }
                if (targetNode !== null) {
                    break;
                }
            }
            if (targetNode !== null) {
                // ok, this is the node on the other end. What is the state value for this output port?
                var value = undefined;
                if (typeof targetNode['outputs'] !== 'undefined') {
                    // value = targetNode['state'][outputPort]['value'];  // this is the internal value, not the calculated one
                    value = targetNode['outputs'][outputPort]['value'];
                }

                // add to inputs
                enabled = enabled && (value != 0);
            }
        }
    }
    return enabled;
}

function isEquivalent(x, y) {
    'use strict';

    if (x === null || x === undefined || y === null || y === undefined) { return x === y; }
    // after this just checking type of one would be enough
    if (x.constructor !== y.constructor) { return false; }
    // if they are functions, they should exactly refer to same one (because of closures)
    if (x instanceof Function) { return x === y; }
    // if they are regexps, they should exactly refer to same one (it is hard to better equality check on current ES)
    if (x instanceof RegExp) { return x === y; }
    if (x === y || x.valueOf() === y.valueOf()) { return true; }
    if (Array.isArray(x) && x.length !== y.length) { return false; }

    // if they are dates, they must had equal valueOf
    if (x instanceof Date) { return false; }

    // if they are strictly equal, they both need to be object at least
    if (!(x instanceof Object)) { return false; }
    if (!(y instanceof Object)) { return false; }

    // recursive object equality check
    var p = Object.keys(x);
    return Object.keys(y).every(function (i) { return p.indexOf(i) !== -1; }) &&
        p.every(function (i) { return isEquivalent(x[i], y[i]); });
}

function clone(obj) {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

// cache all the worker objects to have local persistent worker memory
var workers = {};

// one tick for one node
// returns if the current node is done or if there is more it could do in the next iteration (generator nodes)
function work(node, recipe) {
    // run this node on the current environment
    // collect the inputs for this node
    var inputs = getInputValues(node, recipe);
    var enabled = getEnabledValue(node, recipe);
    if (!enabled) {
        // if we are not enabled we should not have values in our output (state is special because we need values in there)
        if (typeof node['outputs'] !== 'undefined')
            for (var i = 0; i < node['outputs'].length; i++)
                delete node['outputs'][i]['value'];
        /*if (typeof node['state'] !== 'undefined')
           for (var i = 0; i < node['state'].length; i++)
                delete node['state'][i]['value']; */

        return true; // don't do anything, this node is not enabled
    }
    var outputs = {};

    var state = (typeof node['state'] === 'undefined') ? {} : node['state'];
    var gid = node['gid']; // this id is unique for each node - even if there are two of the same type
    // collect the list of outputs
    var worker = null;
    if (typeof workers[gid] == 'undefined') { // create a worker for this node
        if (node['id'] == "redcap-measure-get") {
            worker = new RedcapGet(state); 
        } else if (node['id'] == 'redcap-measure-put') {
            worker = new RedcapPut(node);
        } else if (node['id'] == 'not') {
            worker = new Not(recipe);
        } else if (node['id'] == 'filter') {
            worker = new Filter(recipe);
        } else if (node['id'] == 'mean') {
            worker = new Mean(recipe);
        } else if (node['id'] == 'equal') {
            worker = new Equal(recipe);
        } else if (node['id'] == 'smaller-equal') {
            worker = new SmallerEqual(recipe);
        } else if (node['id'] == 'greater-equal') {
            worker = new GreaterEqual(recipe);
        } else if (node['id'] == 'maximum') {
            worker = new Maximum(recipe);
        } else if (node['id'] == 'minimum') {
            worker = new Minimum(recipe);
        } else if (node['id'] == 'console-out') {
            worker = new ConsoleOut(recipe);
        } else if (node['id'] == 'if-else') {
            worker = new IfElse(recipe);
        } else if (node['id'] == 'all-not-empty') {
            worker = new AllNotEmpty(recipe);
        } else if (node['id'] == 'not-this-value') {
            worker = new NotThisValue(recipe);
        } else if (node['id'] == 'median') {
            worker = new Median(recipe);
        } else if (node['id'] == 'constant-number') {
            worker = new ConstantNumber(recipe);
        } else if (node['id'] == 'constant-text') {
            worker = new ConstantText(recipe);
        } else if (node['id'] == 'sum') {
            worker = new Sum(recipe);
        } else {
            console.log("unknown module type: " + node['id']);
        }
        workers[gid] = { 'worker': worker, 'inputs': inputs, 'outputs': outputs, 'state': state }; // we want to check if any of the inputs or outputs or the internal state changed, if they did not change we are done
    }
    worker = workers[gid]['worker'];

    var done = true;
    if (worker !== null) {
        worker.work(inputs, outputs, state);
        // is the state different? or the outputs? or the inputs?
        if (isEquivalent(workers[gid]['inputs'], inputs) && 
            isEquivalent(workers[gid]['outputs'], outputs) && 
            isEquivalent(workers[gid]['state'], state)) { // do an equivalence check of before and after
            // no change
            done = done && true;
        } else {
            done = done && false;
        }
        workers[gid]['inputs']  = clone(inputs);
        workers[gid]['outputs'] = clone(outputs);
        workers[gid]['state']   = clone(state);

        if (typeof worker.epoch !== 'undefined') {
            var doneDone = worker.epoch(epoch);
            // do we know if an epoch is empty?
            if (doneDone) { // there is no more work to do, stop here
                epoch = -1; // indicate that there are no more epochs
            }
        }

        // what work is producing in outputs is an object with variable names that represent state variables values
        // these values need to be assigned to the output ports that correspond to the state variables

        if (done && typeof worker.done !== 'undefined') {
            done = done && worker.done();
        }
        // ok, now we have the outputs from this module, what do we do with those?
        // set the outputs values to the output ports of this module as values

        // we should set all other values for the outputs to undefined - if we only get a small number of values we should not have old values in the output ports of this node
        for (var i = 0; i < node['outputs'].length; i++) {
            delete node['outputs'][i]['value'];
        }

        var outValNames = Object.keys(outputs);
        for (var i = 0; i < outValNames.length; i++) {
            // the internal state variables line up with the output values, copy that entries values over
            if (typeof node['state'] !== 'undefined' && node['state'].length > 0) {
                for (var j = 0; j < node['state'].length; j++) {
                    if (node['state'][j]['value'] == outValNames[i]) { // tricky bit: the states value is the outputs key
                        // found the value of the internal variable, set this entries output connection value
                        node['outputs'][j]['value'] = outputs[outValNames[i]];
                        break;
                    }
                }
            } //else {
                // as an alternative we don't have an internal state, in that case we just copy the values into the output by name
                for (var j = 0; j < node['outputs'].length; j++) {
                    if (node['outputs'][j]['name'] == outValNames[i]) {
                        node['outputs'][j]['value'] = outputs[outValNames[i]];
                        break;
                    }
                }
            //}
        }
    }
    return done;
}

var epoch = 0; // we have to wait for the graph to finish processing before we can use the next generated data item and start over
var somethingChanged;
function run(recipe) {
    somethingChanged = false;
    for (var i = 0; i < recipe['nodes'].length; i++) {
        var node = recipe['nodes'][i];
        // we will call each node with the input for as long as they do something (compare new with old response)
        var done = work(node, recipe);
        if (!done) {
            somethingChanged = true;
        }
    }
    if (epoch == -1) {
        // no more data, stop here
        console.log("DONE DONE, epochs ended...");
        // lets ask each module to cleanUp
        for (var i = 0; i < recipe['nodes'].length; i++) {
            var node = recipe['nodes'][i];
            var gid = node['gid'];
            if (typeof workers[gid] !== 'undefined') {
                var worker = workers[gid]['worker'];
                if (typeof worker.cleanUp !== 'undefined') {
                    worker.cleanUp();
                }
            }
        }

        return;
    }
    if (!somethingChanged) {
        epoch = epoch + 1; // and try again with the next participant
        //console.log("ADVANCE EPOCH to:" + epoch);
    }
    setTimeout(function () {
        run(recipe);
    }, 10); // wait minimum time period -- 4ms?, in the meantime nodes have time to pull values from REDCap

}

let runSetup = (file, options) => {
    let params = [];
    if (options.output)
        params.push('o')
    if (options.input)
        params.push('i')

    if (file == "" || typeof file === 'undefined') {
        console.log("Error: please provide a filename");
        return;
    }
    exportFileName = file;

    console.log("Import: " + exportFileName + "...");

    // read in the file as json
    var recipe = JSON.parse(fs.readFileSync(exportFileName, 'utf8'));
    console.log("  Found " + recipe['nodes'].length + " nodes and " + recipe['connections'].length + " connections.");

    //setupEnvironment();

    // We will always execute all nodes at the same time for as long as something was done
    var somethingChanged = true;
    run(recipe);
}


program
    .version('0.0.1')
    .command('run [file]')
    .option('-o, --output', 'output file name')
    .option('-i, --input', 'input file name')
    .action(runSetup);

program.parse(process.argv); // end with parse to parse through the input

if (process.argv.length < 3)
    program.help();
