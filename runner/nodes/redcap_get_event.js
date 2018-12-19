//
// do a redcap_get_event and write the requested values into the output
// The module gets an redcap id and a fixed event name
//
//var async   = require("async");
var request = require('request');
var fs      = require('fs');
var path    = require('path');
var readline = require('readline');

var RedcapGetEvent = function (state) {
    this._state                   = state; // this contains the list of variables we need to query from REDCap, ask for them initially instead of in the worker
    this._nextEpoch               = false;
    this._currentEpoch            = 0;
    this._waitingForData          = true;
    this._startedGetAllData       = false;
    this._instrumentEventMappings = [];
    this._dataDictionary          = []; // only items in state are in there
    this._listOfAllowedEvents     = [];
    this._startTime               = new Date().getTime();
    this._currentPGUID            = "";    // keep track of the pGUID we want data for
    this._currentEvent            = "";
    this._currentSite             = "";
    this._startedCall             = false; // track the start of data pulls for the currentPGUID
    this._callsData               = [];
};

// gets a notification if a new epoch started
RedcapGetEvent.prototype.startEpoch = function () {
    this._currentPGUID = "";
    this._startedCall = false;
    this._currentEvent = "";
    this._currentSite = "";
    this._callsData = [];
    //console.log("startEPOCH");
}

RedcapGetEvent.prototype.endEpoch = function () {
    
    // we can end the epoch in two ways, either we never received a pGUID to check data for
    // or we got a pGUID and we did receive the data
}

RedcapGetEvent.prototype.readyForEpoch = function () {
    if (this._startedCall) {
        return false; // not ready for the next epoch
    }
    return true; // we don't block the start of processing
}

// inputs and state are read only, outputs can be written
RedcapGetEvent.prototype.work = function (inputs, outputs, state) {
    // this should be much easier now,
    // we just ask for the values for one participant and say we are ready if its done,
    // no doneDone anymore, we are always readyForEpoch
    // we can veto any endEpoch, need to get the data first from REDCap

    // do we have a connected pGUID?
    var pGUID = "";
    var event = "";
    var site = "";
    var obj = Object.keys(inputs);
    for (var i = 0; i < obj.length; i++) {
        if (obj[i] == "id_redcap") {
            pGUID = inputs[obj[i]];
        }
        if (obj[i] == "data_access_group" && typeof inputs[obj[i]] !== 'undefined') {
            var l = inputs[obj[i]].split("_de");
            if (l.length > 0 && l[0] !== "") {
                site = l[0];
            }            
        }        
    }
    if (pGUID === undefined) {
        return; // do nothing
    }
    for (var i = 0; i < state.length; i++) {
        if (typeof state[i]['value'] === 'undefined')
            continue;
        //console.log(JSON.stringify(state[i]));
        if (state[i]['name'] == 'event') {
            event = state[i]['value'];
        }
    }
    
    if (this._currentPGUID !== pGUID && pGUID !== "" && this._startedCall == false) {
        // seems we have a new pGUID we should use to query data for
        this._currentPGUID = pGUID;
        this._currentEvent = event;
        this._currentSite  = site;
        this._startedCall  = true;
        this._callsData    = []; // indicate that we don't have data for this one yet

        this.getAllData(); // uses the this._pGUID and the event
        //console.log("started a call to REDCap pGUID: " + pGUID + " event: " + event + " site: " + site + "\n");
        return;
    }

    // detect if the values are there and we can copy them to the output
    // copy values to output if we have some
    //console.log("check callsData length: " + this._callsData.length);
    if (this._callsData.length > 0) {
        for (var i = 0; i < state.length; i++) {
            if (typeof state[i]['value'] === 'undefined')
                continue
            if (state[i]['value'] === 'id_redcap' || state[i]['value'] === 'redcap_event_name')
                continue; // don't overwrite
            if (state[i]['name'] == "event")
                continue; // ignore the event for copy back
            //console.log(JSON.stringify(state[i]));

            // get the number for this item
            var parts = state[i]['name'].split("item");
            var outname = "";
            if (parts.length > 1) {
                outname = "out" + parts[1];
            }
            //console.log("state[i]['name']: " + state[i]['name'] + " state[i]['value']: " + state[i]['value'] + " should be: " + outname);
            
            // we should have to send this value to the outN in outputs
            // find out if we have to look for a checkbox, in that case ask for the variable instead
            if (outname !== "") {
                if (typeof this._callsData[0][state[i]['value']] === 'undefined') {
                    outputs[outname] = undefined;
                } else {
                    var val = this._callsData[0][state[i]['value']];
                    outputs[outname] = val;
                }
            }
        }
        //console.log("produce data: " + JSON.stringify(outputs) + " from " + JSON.stringify(this._callsData));
        this._startedCall = false;
    }
};

RedcapGetEvent.prototype.getAllData = function() {
    // get the configuration for this node
    var tokens = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../../code/php/tokens.json'), 'utf8'));
    //var tokens = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../tokens.json'), 'utf8'));
    if (typeof tokens[this._currentSite] == 'undefined') {
        console.log("Error: there is no token for the site " + this._currentSite + "\n");
    }
    
    var token = tokens[this._currentSite];
    var site  = this._currentSite;
    var pGUID = this._currentPGUID;  // get from inputs
    var event = this._currentEvent;  // get from state
    var data = {
        'token': token,
        'content': 'record',
        'format': 'json',
        'type': 'flat',
        'rawOrLabel': 'raw',
        'records[0]': pGUID,
        'fields[0]': 'id_redcap',
        'fields[1]': 'redcap_event_name',
        'events[0]': event,
        'rawOrLabelHeaders': 'raw',
        'exportCheckboxLabel': 'false',
        'exportSurveyFields': 'false',
        'exportDataAccessGroups': 'false',  // we do this manually below based on the token key
        'returnFormat': 'json'
    };
    
    // add the variables to the request
    var count = 2;
    for (var i = 1; i < this._state.length; i++) {
        if (typeof this._state[i]['value'] === 'undefined')
            continue;
        if (this._state[i]['value'] == 'id_redcap' || this._state[i]['value'] == 'redcap_event_name' || this._state[i]['value'] == 'redcap_data_access_group')
            continue;
        
        var val = this._state[i]['value'];
        var re = /(.*)___\d+/;
        var m = val.match(re);
        if (m && m.length > 1) {
            val = m[1]; // replace with text before tripple underscores
        }
        data['fields[' + count + ']'] = val;
        
        count = count + 1;
    }
    //console.log("CALL: " + JSON.stringify(data));

    
    var headers = {
        'User-Agent': 'Super Agent/0.0.1',
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    // The penaly to calling request is that we have to wait here for .1 second
    // This wait will ensure that we don't flood redcap and bring it down using the API. 
    var waitTill = new Date(new Date().getTime() + .1 * 1000);
    while (waitTill > new Date()) { }
    // a while wait ends
    
    var url = "https://abcd-rc.ucsd.edu/redcap/api/";
    request({
        method: 'POST',
        url: url,
        form: data,
        headers: headers,
        json: true
    }, (function(self) {
        return function (error, response, body) {
            if (error || response.statusCode !== 200) {
                // error case
                process.stdout.write("ERROR: could not get a response back from redcap " +
                                     error + " " + JSON.stringify(response) + "\n\n" + JSON.stringify(data));
                self._startedCall = false; // we are not in the call anymore and there is no data
                return;
            }
            self._callsData = body;
            // this._startedCall = false; // do this once we use the data from the body
            //console.log("got data back in callsData " + JSON.stringify(self._callsData));
        };
    })(this));
}

module.exports = RedcapGetEvent;
