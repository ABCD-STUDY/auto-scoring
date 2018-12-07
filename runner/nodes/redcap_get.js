//
// do a redcap_get and write the requested values into the output
//
var async   = require("async");
var request = require('request');
var fs      = require('fs');
var path    = require('path');
var readline = require('readline');

var RedcapGet = function (state) {
    this._state                   = state; // this contains the list of variables we need to query from REDCap, ask for them initially instead of in the worker
    this._participants            = [];
    this._numCalls                = 0;
    this._nextEpoch               = false;
    this._currentEpoch            = 0;
    this._waitingForData          = true;
    this._startedGetAllData       = false;
    this._instrumentEventMappings = [];
    this._dataDictionary          = []; // only items in state are in there
    this._listOfAllowedEvents     = [];
    this._startTime               = new Date().getTime();
    this._maxParticipants         = 0;
    this._participantsShifted     = 0;
};

// gets a notification if a new epoch started - not used for this node
RedcapGet.prototype.startEpoch = function () { }

RedcapGet.prototype.endEpoch = function () {
    if (this._participants.length % 50 == 0) {
        if (this._maxParticipants < this._participants.length) {
            this._maxParticipants = this._participants.length + this._participantsShifted;
        }
        var nowTime = new Date().getTime();
        var doneAlready = this._maxParticipants - this._participants.length;
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0, null);
        var hours = ((nowTime - this._startTime) / doneAlready) * this._participants.length * 0.000000277778;
        var minutes = Math.floor((hours - Math.floor(hours)) * 60);
        var seconds = Math.floor((hours - Math.floor(hours) - (minutes / 60)) * 60 * 60);
        process.stdout.write("[" + this._participants.length + "/" +
            this._maxParticipants + " ETA: " +
                             + Math.floor(hours).toFixed(0) + ":" + ("00" + (minutes).toFixed(0)).slice(-2) + ":" + ("00" + (seconds).toFixed(0)).slice(-2) + "] " + (new Date).toISOString() + "\n");
    }
    this._participants.shift(); // get the next subject
    this._participantsShifted = this._participantsShifted + 1;
}

RedcapGet.prototype.readyForEpoch = function () {
    if (!this._startedGetAllData) {
        this._startedGetAllData = true;
        this.setupGetAllData(); // will call getAllData once setup is done
        // this.getAllData();
    }
    return !this._waitingForData;
}

RedcapGet.prototype.doneDone = function () {
    if (this._numCalls > 0 || this._participants.length > 0) {
        return false; // still work to do in the next epoch
    }
    return true; // nothing more to do
}

// inputs and state are read only, outputs can be written
RedcapGet.prototype.work = function (inputs, outputs, state) {
    if (this._participants.length < 1) {
        console.log("could not get any participants from REDCap, nothing to do here... [debug: _numCalls: " + this._numCalls + " _participants: " + this._participants.length + "]");
        return;
    }

    // this will produce many new values, we should act like a generator (lazy evaluation) and return them one at a time
    // if there are no more values we should tell upstairs

    // pull one of the participants out and get the requested values for that participant
    var entry = this._participants[0];
    if (entry === undefined) {
        // is there another entry?
        console.log('got entry as undefined');
    }

    var pGUID = entry['id_redcap'];
    var redcap_event_name = entry['redcap_event_name'];


    outputs['id_redcap'] = pGUID;
    outputs['redcap_event_name'] = redcap_event_name;
    for (var i = 0; i < state.length; i++) {
        if (typeof state[i]['value'] === 'undefined')
            continue
        if (typeof entry[state[i]['value']] === 'undefined') {
            //console.log("Error: tried to get variable \"" + state[i]['value'] + "\" from REDCap but could not get it.");
            continue
        }
        if (state[i]['value'] === 'id_redcap' || state[i]['value'] === 'redcap_event_name')
            continue // don't overwrite
        // find out if we have to look for a checkbox, in that case ask for the variable instead
        var val = entry[state[i]['value']];
        outputs[state[i]['value']] = val;
    }
    //console.log("input data -> " + JSON.stringify(outputs));
};

// WIP: we need to get some information from REDCap first before we will be able to
// start pulling data. This will make our executation times much lower as optimization
// can be applied to the pulled data (remove entries that cannot be  stored).
RedcapGet.prototype.setupGetAllData = function () {
    // get the instrument event mappings, we also need to get the 
    var tokens = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../../code/php/tokens.json'), 'utf8'));
    //var tokens = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../tokens.json'), 'utf8'));
    var site = "UCSD";
    var self = this;
    self._numCalls++; // we do a call and only finish once this one is done

    var listOfItems = []; // don't count the value we use to identify a particpant
    for (var i = 0; i < this._state.length; i++) {
        if (typeof this._state[i]['value'] === 'undefined')
            continue;
        if (this._state[i]['value'] == 'id_redcap' ||
            this._state[i]['value'] == 'redcap_event_name' ||
            this._state[i]['value'] == 'redcap_data_access_group')
            continue;

        var val = this._state[i]['value'];
        var re = /(.*)___\d+/;
        var m = val.match(re);
        if (m && m.length > 1) {
            val = m[1]; // replace with text before tripple underscores
        }
        if (val !== "" && listOfItems.indexOf(val) === -1) // don't add variables several times
            listOfItems.push(val);
    }
    console.log("List of variables we request from REDCap: " + JSON.stringify(listOfItems));

    var data = {
        'token': tokens[site],
        'content': 'formEventMapping',
        'format': 'json',
        'returnFormat': 'json'
    };

    var headers = {
        'User-Agent': 'Super Agent/0.0.1',
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    // The penaly to calling request is that we have to wait here for .5 second
    // This wait will ensure that we don't flood redcap and bring it down using the API. 
    var waitTill = new Date(new Date().getTime() + 10 * 1000);
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
        self._numCalls--;
        if (error || response.statusCode !== 200) {
            // error case
            console.log("Error getting event-instrument mappings from REDCap: \"" + error + "\", response:\n" + JSON.stringify(response));
            return;
        }
        //console.log("GOT BODY: " + JSON.stringify(body));
        self._instrumentEventMappings = body;

        // now calculate the list of forms that we need and from there the event that they are enabled for
        /* 
           $data = array(
           'token' => '203916E7BD6A3AC814BAD05109FDA87D',
           'content' => 'metadata',
           'format' => 'json',
           'returnFormat' => 'json',
           'fields' => array('hangover6_l','iqc_sst_2_pc_score','ksads_20_695_p')
           );
           $ch = curl_init();
           curl_setopt($ch, CURLOPT_URL, 'https://abcd-rc.ucsd.edu/redcap/api/');
           curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
           curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
           curl_setopt($ch, CURLOPT_VERBOSE, 0);
           curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
           curl_setopt($ch, CURLOPT_AUTOREFERER, true);
           curl_setopt($ch, CURLOPT_MAXREDIRS, 10);
           curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
           curl_setopt($ch, CURLOPT_FRESH_CONNECT, 1);
           curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data, '', '&'));
           $output = curl_exec($ch);
           print $output;
           curl_close($ch);
        */

        var data = {
            'token': tokens[site],
            'content': 'metadata',
            'format': 'json',
            'returnFormat': 'json',
            'fields': listOfItems
        };

        var headers = {
            'User-Agent': 'Super Agent/0.0.1',
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        // The penaly to calling request is that we have to wait here for .5 second
        // This wait will ensure that we don't flood redcap and bring it down using the API. 
        var waitTill = new Date(new Date().getTime() + 10 * 1000);
        while (waitTill > new Date()) { }
        // a while wait ends

        self._numCalls++;
        var url = "https://abcd-rc.ucsd.edu/redcap/api/";
        request({
            method: 'POST',
            url: url,
            form: data,
            headers: headers,
            json: true
        }, function (error, response, body) {
            self._numCalls--;
            if (error || response.statusCode !== 200) {
                // error case
                console.log("Error getting data dictionary entries for from REDCap: \"" + error + "\", response:\n" + JSON.stringify(response));
                return;
            }
            // ok, now we know
            self._dataDictionary = body;
            self._listOfAllowedEvents = {};
            for (var i = 0; i < self._dataDictionary.length; i++) {
                var item = self._dataDictionary[i]['field_name'];
                var instrument = self._dataDictionary[i]['form_name'];
                for (var j = 0; j < self._instrumentEventMappings.length; j++) {
                    // which of the fields we have in listOfItems
                    if (self._instrumentEventMappings[j]['form'] == instrument) {
                        if (self._instrumentEventMappings[j]['unique_event_name'] !== "")
                            self._listOfAllowedEvents[self._instrumentEventMappings[j]['unique_event_name']] = 1;
                        // could happen several times (one form in several events)
                    }
                }
            }
            self._listOfAllowedEvents = Object.keys(self._listOfAllowedEvents);
            console.log("List of allowed events is: " + JSON.stringify(self._listOfAllowedEvents));
            self.getAllData(); // now we are ready to request data from REDCap (limited to these events)
            // what about enroll_total... its not in the list but might be defined for every event... should be removed
            // TODO: find out which of the input ports are actually connected to something, only those items are used in
            // the network and need to be in the list of items to map against the form/events.
        })
    });
};

RedcapGet.prototype.getAllData = function() {
    // get the configuration for this node
    var tokens = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../../code/php/tokens.json'), 'utf8'));
    //var tokens = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../tokens.json'), 'utf8'));

    // we are called here the first time, work is called every time and done tells us if we done
    var queue = async.queue(function (st, callback) {
        var token = st.token;
        var self = st.self;
        var site = st.site;
        var data = {
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

        // limit request to events in this._listOfAllowedEvents
        var countEvents = 0;
        if (self._listOfAllowedEvents.length > 0) {
            for (var i = 0; i < self._listOfAllowedEvents.length; i++) {
                data['events[' + countEvents + ']'] = self._listOfAllowedEvents[i];
                countEvents = countEvents + 1;
            }
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
                // Optimization, create a list of the forms, get a list of the event - instrument mappings
                // Don't add entries that have forms that are not enabled for the current instrument
                // Problem: Some variables might exist in the correct form, some not is this ok? Would introduce limitation if we form
                // that all variables need to be in instruments that are enabled for the current event.
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
}

module.exports = RedcapGet;
