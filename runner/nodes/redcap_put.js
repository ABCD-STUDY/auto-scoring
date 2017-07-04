//
// do a redcap_put
//
var async = require("async");
var request = require('request');
var fs = require('fs');
var path = require('path');
//var json = require('json');


var RedcapPut = function (n) {
    this._node = n; // this contains the list of variables we need to query from REDCap, ask for them initially instead of in the worker
    this._results = [];
    this._currentEpoch = 0;
    this._lastData = null;
    this._batchSendSize = 20; // every 100 participants send something to REDCap
};

// return true if no more data can be generated
RedcapPut.prototype.done = function () {
    return true;
}

// for the current epoch always show the same participant's data (need time to process the graph)
RedcapPut.prototype.epoch = function (epoch) {
    if (epoch !== this._currentEpoch) {
        this._currentEpoch = epoch;
        if (this._lastData !== null) {
            console.log("save a participants data (epoch: " + epoch + ") ... " + this._lastData['id_redcap'] + " -> " + JSON.stringify(this._lastData));
            this.addResult(this._lastData); // save the last epochs results
            this._lastData = null;
        }
    }

    return false; // we are not doneDone, only RedcapGet get tell us
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

// sends scores back to redcap
function sendToREDCap( scores ) {
    // we should send a batch of the scores to REDCap, remove those from the list that we have already
    // sent out
    // How to prevent too fast send operations? For now hope the program is slow enough...

    var tokens = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../../code/php/tokens.json'), 'utf8'));
    //var tokens = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../../code/php/mastertoken.json'), 'utf8'));
    //var tokens = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../mastertoken.json'), 'utf8'));

    var localScores = {}; // send by site and event to be able to use the normal tokens and limit error messages
    // only send data that we have not send before
    for (var i = 0; i < scores['scores'].length; i++) {
	if (typeof scores['scores'][i]['redcap_data_access_group'] === 'undefined') {
	    console.log("ERROR: no redcap_data_access_group available in imported data");
	}
	var site  = scores['scores'][i]['redcap_data_access_group'];
	var event = scores['scores'][i]['redcap_event_name'];	
        if (typeof scores['scores'][i]['_send_marker'] === 'undefined') {
	    var tmp = clone(scores['scores'][i]);
	    // lets test if converting the results to strings makes a difference to REDCap
	    var keys = Object.keys(tmp);
	    for (var j = 0; j < keys.length; j++) {
		tmp[keys[j]] = '' + tmp[keys[j]]; // convert to string;
	    }
	    if (typeof tmp['redcap_data_access_group'] !== 'undefined') {
   		delete tmp['redcap_data_access_group'];
	    }
	    if (typeof localScores[site] === 'undefined') {
		localScores[site] = {};
	    }
	    if (typeof localScores[site][event] === 'undefined') {
		localScores[site][event] = [];
	    }
            localScores[site][event].push(tmp);
            scores['scores'][i]['_send_marker'] = 1;
        }
    }
    var sites = Object.keys(localScores);
    var numScores = 0;
    for (var i = 0; i < sites.length; i++) {
	var events = Object.keys(localScores[sites[i]]);
	for (var j = 0; j < events.length; j++) {
	    numScores = numScores + localScores[sites[i]][events[j]].length;
	}
    }
    if (numScores == 0) {
        console.log("No more scores to send")
    }
    //console.log("Send over:\n" + JSON.stringify(localScores, null, '  '));

    // we are called here the first time, work is called every time and done tells us if we done
    var queue = async.queue(function (st, callback) {
        var token  = st.tokens;
        var self   = st.self;
	var site   = st.site;
        var scores = st.scores;

        var data  = {
            'token': tokens[site],
            'content': 'record',
            'format': 'json',
            'type': 'flat',
            'overwriteBehavior': 'normal',
            'data': JSON.stringify( scores ),
            'returnContent': 'count',
            'returnFormat': 'json'
        };

        var headers = {
            'User-Agent': 'Super Agent/0.0.1',
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        var url = "https://abcd-rc.ucsd.edu/redcap/api/";
        request({
            method: 'POST',
            url: url,
            form: data,
            headers: headers,
            json: true
        }, function (error, response, body) {
            if (error || response.statusCode !== 200) {
                // error case
                process.stdout.write("Error sending data (REDCap): \"" + error + "\", response:\n" + JSON.stringify(response) + "\n");
            } 
        }).on('response', function(response) {
	    console.log("WORKING, submitted:\n" + JSON.stringify(response));
	    callback();
	});

    }, 1); // Run one simultaneous download

    // is called after all the values have been pulled
    queue.drain = (function (self) {
        return function() {
            console.log("did send all participants to redcap ");
        };
    })(this);

    var sites = Object.keys(localScores);
    for (var i = 0; i < sites.length; i++) {
        var site = sites[i];
	var events = Object.keys(localScores[sites[i]]);
	for (var j = 0; j < events.length; j++) {
            queue.push( { token: tokens, self: this, site: site, scores: localScores[site][events[j]] }, (function (site) {
		return function (err) {
                    console.log("Finished sending data for site " + site + "\n");
		};
            })(site));
	}
    }
}

// cache the results before sending them off to someone
RedcapPut.prototype.addResult = function (r) {
    // find out if we have this result already (make this unique by the id_redcap and redcap_event_name)
    var found = false;
    for (var i = 0; i < this._results.length; i++) {
        if (r['id_redcap'] === this._results[i]['id_redcap'] &&
            r['redcap_event_name'] === this._results[i]['redcap_event_name']) {
                // add the values to this event
                var keys = Object.keys(r);
                for (var j = 0; j < keys.length; j++) {
                    if (keys[j] === 'id_redcap' || keys[j] === 'redcap_event_name')
                        continue;
                    this._results[i][keys[j]] = r[keys[j]];
                }
                found = true;
                break;
        }
    }
    if (!found) {
        this._results.push(r);
    }
    if ((this._results.length % this._batchSendSize) == 0) {
        sendToREDCap( { scores: this._results } );
    }
}

RedcapPut.prototype.cleanUp = function () {
    // a change to print out results, or to send things off to someone else
    sendToREDCap( { scores: this._results } );
    console.log("Results after sending (" + this._results.length + "): \n" + JSON.stringify(this._results, null, '  '));
}

// We would like to cache the data we send to REDCap, that way we can limit the send operations in case something has been transferred already
RedcapPut.prototype.work = function (inputs, outputs, state) {

    var data = {};
    var obj = Object.keys(inputs);
    for (var i = 0; i < obj.length; i++) {
        var outputName = "";
        // if we have an input with a name we need to find the index for it in the inputs array of this node to know the state's variable name
        for (var j = 0; j < this._node['inputs'].length; j++) {
            if (this._node['inputs'][j]['name'] == obj[i]) {
                // ok, the index j is the one we need from the state
                
                outputName = this._node['state'][j]['value'];
                break;
            }
        }
        if (outputName !== "" && typeof inputs[obj[i]] !== 'undefined' && inputs[obj[i]] !== undefined) {
            data[outputName] = inputs[obj[i]];
        }
    }
    // do we have something to send? (more than just the id_redcap and redcap_event_name)
    if (typeof data['id_redcap'] === 'undefined' || data['id_redcap'] === "" ||
        typeof data['redcap_event_name'] === 'undefined' || data['redcap_event_name'] === "") {
        console.log("redcap_put: insufficient data, require id_redcap and redcap_event_name");
    } else {
        if (Object.keys(data).length > 2) {
            this._lastData = data;
        } else {
            //console.log("redcap_put: insufficient data, requires a value for REDCap, not just id_redcap and redcap_event_name");
        }
    }
    // every once in a while send the collated data to REDCap
    //if (this._results.length % 50 == 0) {
        //console.log("Results (" + this._results.length + "): \n" + JSON.stringify(this._results, null, '  '));
    //}
};

module.exports = RedcapPut;
