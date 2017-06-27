//
// do a redcap_put
//
var async = require("async");
var request = require('request');
var fs = require('fs');
var path = require('path');


var RedcapPut = function (n) {
    this._node = n; // this contains the list of variables we need to query from REDCap, ask for them initially instead of in the worker
    this._results = [];
    this._currentEpoch = 0;
    this._lastData = null;
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
            console.log("save a participants data... " + this._lastData['id_redcap'] + " -> " + JSON.stringify(this._lastData));
            this.addResult(this._lastData); // save the last epochs results
        }
    }

    return false; // we are not doneDone, only RedcapGet get tell us
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
}

// We would like to cache the data we send to REDCap, that way we can limit the send operations in case something has been transferred already
RedcapPut.prototype.work = function (inputs, outputs, state) {

    // pull one of the participants out and get the requested values for that participant
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
        console.log("Results (" + this._results.length + "): \n" + JSON.stringify(this._results, null, '  '));
    //}
};

module.exports = RedcapPut;
