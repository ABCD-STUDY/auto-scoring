//
// do a redcap_get and write the requested values into the output
//
var async = require("async");
var request = require('request');
var fs = require('fs');
var path = require('path');


//var participants = null;
//var numCalls = 0; // can we call now many times we call REDCap? If this value is 0 we are done - or we did not start yet

var RedcapGet = function (state) {
    this._state = state; // this contains the list of variables we need to query from REDCap, ask for them initially instead of in the worker
    this._participants = [];
    this._numCalls = 0;
    this._nextEpoch = false;
    this._currentEpoch = 0;
    this._waitingForData = true;

    // get the configuration for this node
    //var tokens = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../../code/php/tokens.json'), 'utf8'));
    var tokens = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../tokens.json'), 'utf8'));

    // we are called here the first time, work is called every time and done tells us if we done
    var queue = async.queue(function (st, callback) {
        var token = st.token;
        var self  = st.self;
	var site  = st.site;
        var data  = {
            'token': token,
            'content': 'record',
            'format': 'json',
            'type': 'flat',
            'rawOrLabel': 'raw',
            'fields[0]': 'id_redcap',
            'fields[1]': 'redcap_event_name',
            //'events[0]': 'baseline_year_1_arm_1', // baseline only?
            'rawOrLabelHeaders': 'raw',
            'exportCheckboxLabel': 'false',
            'exportSurveyFields': 'false',
            'exportDataAccessGroups': 'false',  // we do this manually below based on the token key
            'returnFormat': 'json'
        };

        // add the variables to the request
        var count = 2;
        for (var i = 0; i < self._state.length; i++) {
            if (typeof self._state[i]['value'] === 'undefined')
                continue;
            if (self._state[i]['value'] == 'id_redcap' || self._state[i]['value'] == 'redcap_event_name' || self._state[i]['value'] == 'redcap_data_access_group')
                continue;

            var val = self._state[i]['value'];
            var re = /(.*)___\d+/;
            var m = val.match(re);
            if (m && m.length > 1) {
                val = m[1]; // replace with text before tripple underscores
            }
            data['fields[' + count + ']'] = val;
            
            count = count + 1;
        }

        var headers = {
            'User-Agent': 'Super Agent/0.0.1',
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        // The penaly to calling request is that we have to wait here for .5 second
        // This wait will ensure that we don't flood redcap and bring it down using the API. 
        var waitTill = new Date(new Date().getTime() + .5 * 1000);
        while (waitTill > new Date()) { }
        // a while wait ends

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
                process.stdout.write("ERROR: could not get a response back from redcap " + error + " " + JSON.stringify(response) + "\n");
                return;
            }

            // now do something with this information
            // process.stdout.write(JSON.stringify(body));
            for (var i = 0; i < body.length; i++) {
                var entry = body[i];
                entry['redcap_data_access_group'] = site;
                self._participants.push(entry);
            }
            self._waitingForData = false; // we got some data from REDCap (what if this takes too long?)
            //console.log("do the callback now...");
            callback();
        });

    }, 1); // Run one simultaneous download

    // is called after all the values have been pulled
    queue.drain = (function (self) {
        return function() {
            console.log("got all participants from redcap " + self._participants.length);
            //findProblems( tokens );
            self._numCalls = 0;
        };
    })(this);

    // Queue your files for upload
    var sites = Object.keys(tokens);
    for (var i = 0; i < sites.length; i++) {
        var site = sites[i];
        if (site == "TEST") {
            continue;
        }
        if (site == "OAHU") {
            continue;
        }
        queue.push( { token: tokens[site], self: this, site: site }, (function (site, self) {
            return function (err) {
                console.log("finished getting data for site: " + site + " num participants is:" + this.data.self._participants.length);
                self._numCalls = self._numCalls - 1; // one less call to wait for
            };
        })(site, this));
        this._numCalls = this._numCalls + 1;
    }
};

// gets a notification of a new epoch started
RedcapGet.prototype.startEpoch = function () {
    //this._nextEpoch = true;
    // we should through away the current participant .. its done
}

RedcapGet.prototype.endEpoch = function () {
    this._participants.shift(); // get the next subject      
}

RedcapGet.prototype.readyForEpoch = function () {
    return !this._waitingForData;
}

RedcapGet.prototype.doneDone = function () {
    if (this._numCalls > 0 || this._participants.length > 0) {
        return false; // still work to do in the next epoch
    }
    return true; // nothing more to do
}


// for the current epoch always show the same participant's data (need time to process the graph)
RedcapGet.prototype.epoch = function (epoch) {
    if (epoch !== this._currentEpoch) {
        this._nextEpoch = true;  // provide the next participant's data
        this._currentEpoch = epoch;
    }
    // only test this if we ever had a value, otherwise wait for the data to come in
    if (this._numCalls > 0 || this._participants.length > 0) {
        return false; // still work to do in the next epoch
    }

    return true; // we are doneDone, no more participants
}

RedcapGet.prototype.done = function() {
    // indicate that there was a change if we are just waiting for data coming in
    return !this._waitingForData;
}

// inputs and state are read only, outputs can be written
RedcapGet.prototype.work = function (inputs, outputs, state) {
    if (this._participants.length < 1) {
        console.log("could not get any participants from REDCap, nothing to do here...");
        return;
    }

    // this will produce many new values, we should act like a generator (lazy evaluation) and return them one at a time
    // if there are no more values we should tell upstairs

    // pull one of the participants out and get the requested values for that participant
    var entry = this._participants[0];
    if (entry === undefined) {
        // is there another entry?
        console.log("got entry as undefined");
    }


 /*   if (this._nextEpoch) {
        this._participants.shift(); // get the next subject
        if (this._participants.length < 1) {
            console.log("could not get any participants from REDCap, nothing to do here...");
            return;
        }
        entry = this._participants[0];
        this._nextEpoch = false;
        //console.log("pull a new participant: " + entry['id_redcap'] + ", " + entry['redcap_event_name'] + " (" + this._participants.length + ")");
    } */
    var pGUID = entry['id_redcap'];
    var redcap_event_name = entry['redcap_event_name'];


    outputs['id_redcap'] = pGUID;
    outputs['redcap_event_name'] = redcap_event_name;
    for (var i = 0; i < state.length; i++) {
        if (typeof state[i]['value'] === 'undefined')
            continue;
        if (typeof entry[ state[i]['value'] ] === 'undefined' ) {
            //console.log("Error: tried to get variable \"" + state[i]['value'] + "\" from REDCap but could not get it.");
            continue;
        }
        if ( state[i]['value'] === 'id_redcap' || state[i]['value'] === 'redcap_event_name' )
            continue; // don't overwrite
        // find out if we have to look for a checkbox, in that case ask for the variable instead
        var val = entry [ state[i]['value'] ];
        outputs[ state[i]['value'] ] = val;
    }
};

module.exports = RedcapGet;
