#!/usr/bin/env nodejs
//#!/usr/bin/env node


// run this with:
//   ./runner.js run -i ../viewer/recipes/FirstTest.json

//
// for testing purposes you can write the node values out to test.json with (streaming json):
//   ./runner.js run -h history.txt -i ../viewer/recipes/cna.json

//
// for testing the debugging do:
//   ./runner.js run -d /tmp/debug.json -s 10 ../viewer/recipes/ssrs.json

'use strict';

const program = require('commander');
var request = require('request');
var fs = require('fs');
//var zlib = require('zlib');
var path = require('path');

var Not            = require("./nodes/not.js")
var Equal          = require("./nodes/equal.js")
var RedcapGet      = require("./nodes/redcap_get.js")
var RedcapPut      = require("./nodes/redcap_put.js")
var Mean           = require("./nodes/mean.js")
var Median         = require("./nodes/median.js")
var Sum            = require("./nodes/sum.js")
var AllNotEmpty    = require("./nodes/all-not-empty.js")
var NotThisValue   = require("./nodes/not-this-value.js")
var ConsoleOut     = require("./nodes/console-out.js")
var IfElse         = require("./nodes/if-else.js")
var ConstantNumber = require("./nodes/constant-number.js")
var ConstantText   = require("./nodes/constant-text.js")
var SmallerEqual   = require("./nodes/smallerequal.js")
var GreaterEqual   = require("./nodes/greaterequal.js")
var Smaller        = require("./nodes/smaller.js")
var Greater        = require("./nodes/greater.js")
var Maximum        = require("./nodes/maximum.js")
var Minimum        = require("./nodes/minimum.js")
var Filter         = require("./nodes/filter.js")
var TScore         = require("./nodes/t-score.js")

var exportFileName = "";
// if we are asked to debug we will store the evaluation of the graph into this file
// the viewer should be able to read this later and replay
var historyFile = "";
var debugFile   = "";
var numSteps    = 0;

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
            if (connections[i]['target'].indexOf(id) !== -1) {
		// found one connection that leads to this node (inputs have to be singeltons? Or can we have more than one input and we pick a random value?)
                // what is the node on the other end of the connection? This node is the target.
                var targetNodeID = connections[i]['source'];
                var targetNode = null;
                var outputPort = null;
                for (var j = 0; j < nodes.length; j++) {
                    for (var k = 0; k < nodes[j]['outputs'].length; k++) {
                        if (targetNodeID.indexOf(nodes[j]['outputs'][k]['id']) !== -1) {
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
                        if (typeof targetNode['outputs'][outputPort]['value'] !== 'undefined')
                            value = targetNode['outputs'][outputPort]['value'];
                    }

                    // add to inputs
                    // for undefined this would indicate that a value was expected - but could not be set by the recipe at this point in time
                    if (typeof inputs[thisinputName] === 'undefined' || inputs[thisinputName] === undefined) {
			// if we have more than one connection to this node we should use the last one that has a value not undefined
                        inputs[thisinputName] = value;
		    }
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
        if (connections[i]['target'].indexOf(id) !== -1) {
	    // found one connection that leads to this node (inputs have to be singeltons? Or can we have more than one input and we pick a random value?)
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

// test all workers if all are ready for the next epoch,
// a worker that is getting data from outside would return false for as long
// as its still waiting for data to come in. Once a dataset is there it
// would return true.
// If a node does not implment this function we assume the node is born ready.
function readyForEpoch(recipe) {
    var ready = true;
    for (var i = 0; i < recipe['nodes'].length; i++) {
        var node = recipe['nodes'][i];
        var gid = node['gid']; // this id is unique for each node - even if there are two of the same type
        if (typeof workers[gid] !== 'undefined') {
            var worker = workers[gid]['worker'];
            if (typeof worker.readyForEpoch !== 'undefined') {
                ready = ready && worker.readyForEpoch(epoch);
            }
        }
    }
    return ready;
}

// notify all nodes that a new epoch started
function startEpoch(recipe) {
    for (var i = 0; i < recipe['nodes'].length; i++) {
        var node = recipe['nodes'][i];
        var gid = node['gid']; // this id is unique for each node - even if there are two of the same type
        if (typeof workers[gid] !== 'undefined') {
            var worker = workers[gid]['worker'];
            if (typeof worker.startEpoch !== 'undefined') {
                worker.startEpoch();
            }
        }
    }
}

// notify all nodes that the epoch is over
// The nodes that save data can do this here. Nodes don't have to implement this function.
function endEpoch(recipe) {
    for (var i = 0; i < recipe['nodes'].length; i++) {
        var node = recipe['nodes'][i];
        var gid = node['gid']; // this id is unique for each node - even if there are two of the same type
        if (typeof workers[gid] !== 'undefined') {
            var worker = workers[gid]['worker'];
            if (typeof worker.endEpoch !== 'undefined') {
                worker.endEpoch();
            }
        }
    }
}

// at the very end tell nodes to cleanUp after themselves
function cleanUp(recipe) {
    for (var i = 0; i < recipe['nodes'].length; i++) {
        var node = recipe['nodes'][i];
        var gid = node['gid']; // this id is unique for each node - even if there are two of the same type
        var worker = workers[gid]['worker'];
        if (typeof worker.cleanUp !== 'undefined') {
            worker.cleanUp();
        }
    }
}

// ask each node if there is more work
// Nodes should implement this if they provide data into the data flow. If this function is not implemented we
// assume the node is done.
function doneDone(recipe) {
    var ready = true;
    for (var i = 0; i < recipe['nodes'].length; i++) {
        var node = recipe['nodes'][i];
        var gid = node['gid']; // this id is unique for each node - even if there are two of the same type
        if (typeof workers[gid] !== 'undefined') {
            var worker = workers[gid]['worker'];
            if (typeof worker.doneDone !== 'undefined') {
                ready = ready && worker.doneDone();
            }
        }
    }
    return ready;
}

// cache all the worker objects to have local persistent worker memory
var workers = {};

function createWorker( id, state, node, recipe) {
    switch (id ) {
    case "redcap-measure-get":
        return new RedcapGet(state);
    case 'redcap-measure-put':
        return new RedcapPut(node);
    case 'not':
        return new Not(recipe);
    case 'filter':
        return new Filter(recipe);
    case 'mean':
        return new Mean(recipe);
    case 'equal':
        return new Equal(recipe);
    case 'smaller-equal':
        return new SmallerEqual(recipe);
    case 'greater-equal':
        return new GreaterEqual(recipe);
    case 'smaller':
        return new Smaller(recipe);
    case 'greater':
        return new Greater(recipe);
    case 'maximum':
        return new Maximum(recipe);
    case 'minimum':
        return new Minimum(recipe);
    case 'console-out':
        return new ConsoleOut(recipe);
    case 'if-else':
        return new IfElse(recipe);
    case 'all-not-empty':
        return new AllNotEmpty(recipe);
    case 'not-this-value':
        return new NotThisValue(recipe);
    case 'median':
        return new Median(recipe);
    case 'constant-number':
        return new ConstantNumber(recipe);
    case 'constant-text':
        return new ConstantText(recipe);
    case 't-score':
        return new TScore(recipe);
    case 'sum':
        return new Sum(recipe);
    default:
        console.log("unknown module type: " + id);
	return null;
    }
}


// one tick for one node
// returns if the current node is done or if there is more it could do in the next iteration (generator nodes)
function work(node, recipe) {
    // run this node on the current environment
    // collect the inputs for this node
    var inputs = getInputValues(node, recipe);
    var enabled = getEnabledValue(node, recipe);
    if (!enabled) {
        // if we are not enabled we should not have values in our output (state is special because we need values in there)
        if (typeof node['outputs'] !== 'undefined') {
            for (var i = 0; i < node['outputs'].length; i++)
                delete node['outputs'][i]['value'];
        }

        return true; // don't do anything, this node is not enabled
    }
    var outputs = {};

    var state = (typeof node['state'] === 'undefined') ? {} : node['state'];
    var gid = node['gid']; // this id is unique for each node - even if there are two of the same type
    // collect the list of outputs
    var worker = null;
    if (typeof workers[gid] == 'undefined') { // create a worker for this node
	worker = createWorker( node['id'], state, node, recipe );
	// we want to check if any of the inputs or outputs or the internal state changed, if they did not change we are done
	if (worker !== null)
            workers[gid] = { 'worker': worker, 'inputs': inputs, 'outputs': outputs, 'state': state, 'id': node['id'] }; 
    }
    worker = workers[gid]['worker'];

    var done = true;
    if (worker !== null) {
        worker.work(inputs, outputs, state);
        if (historyFile != "") {
            fs.appendFileSync(historyFile, JSON.stringify({ 
                'node-id': node['id'],
                'node-gid': gid,
                'epoch': epoch, 
                'inputs': inputs, 
                'outputs': outputs }) + "\n" );
        }

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

        // we should set all other values for the outputs to undefined -
	// if we only get a small number of values we should not have old values in the output ports of this node
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
            }
            // as an alternative we don't have an internal state, in that case we just copy the values into the output by name
            for (var j = 0; j < node['outputs'].length; j++) {
                if (node['outputs'][j]['name'] == outValNames[i]) {
                    node['outputs'][j]['value'] = outputs[outValNames[i]];
                    break;
                }
            }
        }
    }
    return done;
}

// this will not work because workers cannot be stringified
function saveEnvironment ( filename, recipe ) {
    var all = ['epoch', 'recipe', 'workers' ];
    var storageObject = {};
    for(var i = 0; i < all.length; i++) {
	storageObject[all[i]] = eval(all[i]);
    }
    fs.writeFileSync(filename, JSON.stringify(storageObject), 'utf-8');
}

var epoch = 0; // we have to wait for the graph to finish processing before we can use the next generated data item and start over
function run(recipe) {
    var somethingChanged = false;
    for (var i = 0; i < recipe['nodes'].length; i++) {
        var node = recipe['nodes'][i];
        // we will call each node with the input for as long as they do something (compare new with old responses)
        var done = work(node, recipe);
        if (!done) {
            somethingChanged = true;
        }
    }
    if ( !readyForEpoch(recipe) ) { // only if we are ready for this epoch look at somethingChanged to find out if we are done
        somethingChanged = true; 
    }

    if ( doneDone(recipe) ) { // everyone is done
        // no more data, stop here
        console.log("DONE DONE, epochs ended...");
        // lets ask each module to cleanUp
        cleanUp(recipe);

        return;
    }
    if (!somethingChanged) {
        endEpoch(recipe);   // notify all nodes that an epoch ended so they can store the result
        epoch = epoch + 1; // and try again with the next participant
        startEpoch(recipe); // notify all nodes that a new epoch should start - wait with readyForEpoch to find out if we are ready to process
    }
    setTimeout(function() {
	//console.log("DEBUGFILE: " + debugFile + " numsteps: " + numSteps + "\n");
	if (debugFile !== "" && numSteps >= 0) {
	    numSteps = numSteps - 1;
	}
	if (debugFile !== "" && numSteps < 0) {
	    // we are done, save the environment for the next iteration in debugFile
	    saveEnvironment(debugFile, recipe);
	    return;
	}
        run(recipe);
    }, 10); // wait minimum time period -- 4ms?, in the meantime nodes have time to pull values from REDCap
    
}

let runSetup = (file, options) => {
    let params = [];
    if (options.history)
        params.push('h')
    if (options.debug)
        params.push('d')
    if (options.steps)
        params.push('s')

    if (options.history && options.history != "") {
        console.log("Info: will write history information to " + options.history);
        historyFile = options.history;
    }

    if (options.steps && options.steps != "") {
        console.log("Info: will perform " + options.steps + " program steps");
        numSteps = options.steps;
    }

    if (options.debug && options.debug != "") {
        console.log("Info: will store debugging information in " + options.debug);
        debugFile = options.debug;
	// if we have this file already try to continue using the information inside
	if (fs.existsSync(debugFile)) {
	    // read and get values from it
	    var content = JSON.parse(fs.readFileSync(debugFile, 'utf8'));
	    // distribute the results to the internal variables
	    epoch    = content['epoch'];
	    recipe   = content['recipe'];
	    workers  = content['workers'];
	    var keys = Object.keys(workers);
	    for (var i = 0; i < keys.length; i++) {
		// find the node
		var node = null;
		for(var j = 0; j < recipe['nodes'].length; j++) {
		    if (recipe['nodes'][j]['id'] == workers[keys[i]]['id']) {
			node = recipe['nodes'][j];
			break;
		    }
		}
		if (node === null) {
		    console.log("Error: unknown node in debugFile");
		}
		var state  = (typeof node['state'] === 'undefined') ? {} : node['state'];
		var worker = createWorker(workers[keys[i]]['id'], state, node, recipe);
		// after we create a worker we need to copy the existing internal variables over
		var objs = Object.keys(workers[keys[i]]['worker']);
		for (var k = 0; k < objs.length; k++) {
		    worker[objs[k]] = workers[keys[i]]['worker'][objs[k]];
		}				      
		workers[keys[i]]['worker'] = worker;
	    }
	    // start the processing
	    run(recipe);
	    return;
	}
	
    }

    if (file == "" || typeof file === 'undefined') {
        console.log("Error: please provide a filename");
        return;
    }
    exportFileName = file;

    console.log("Import: " + exportFileName + "...");

    // read in the file as json
    var recipe = JSON.parse(fs.readFileSync(exportFileName, 'utf8'));
    console.log("  Found " + recipe['nodes'].length + " nodes and " + recipe['connections'].length + " connections.");

    // start processing loop
    run(recipe);
}


program
    .version('0.0.1')
    .command('run [file]')
    .option('-h, --history [historyFile]', 'history file name')
    .option('-d, --debug [debugFile]', 'debug file name')
    .option('-s, --steps [numSteps]', 'number of steps to perform')
    .action(runSetup);

program.parse(process.argv); // end with parse to parse through the input

if (process.argv.length < 3)
    program.help();
