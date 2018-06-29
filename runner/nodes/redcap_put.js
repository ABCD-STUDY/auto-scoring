//
// do a redcap_put
//
var async = require("async");
var request = require('request');
var fs = require('fs');
var path = require('path');
//var json = require('json');


var RedcapPut = function (n, pretendMode) {
    this._node = n; // this contains the list of variables we need to query from REDCap, ask for them initially instead of in the worker
    this._results = [];
    this._currentEpoch = 0;
    this._lastData = null;
    this._batchSendSize = 400; // every 200 participants send something to REDCap
    this._pretendMode = pretendMode;
    if (pretendMode) {
        console.log("enable pretend mode, nothing will be forwarded...");
    } else {
        console.log("pretend mode off, data is forwarded...");
    }        
};

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
function sendToREDCap(scores, pretendMode) {
    if (pretendMode == true) {
        for (var i = 0; i < scores['scores'].length; i++) {
            scores['scores'][i]['_send_marker'] = 1; // pretend to have done something
        }
        console.log("Pretend mode send...");
        return; // don't do anything
    }

    // we should send a batch of the scores to REDCap, remove those from the list that we have already
    // sent out
    // How to prevent too fast send operations? For now hope the program is slow enough...

    var tokens = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../../code/php/tokens.json'), 'utf8'));
    //var tokens = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../tokens.json'), 'utf8'));

    var localScores = {}; // send by site and event to be able to use the normal tokens and limit error messages
    // only send data that we have not send before
    for (var i = 0; i < scores['scores'].length; i++) {
        if (typeof scores['scores'][i]['redcap_data_access_group'] === 'undefined') {
            console.log("ERROR: no redcap_data_access_group available in imported data");
            continue;
        }
        var site = scores['scores'][i]['redcap_data_access_group'];
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

    // we are called here the first time, work is called every time and done tells us if we done
    var queue = async.queue(function (st, callback) {
        var token  = st.tokens;
        var self   = st.self;
        var site   = st.site;
        var scores = st.scores;
        if (typeof st.scores === 'undefined' || st.scores === undefined) {
            return; // no scores to send
        }

        var data = {
            'token': tokens[site],
            'content': 'record',
            'format': 'json',
            'type': 'flat',
            'overwriteBehavior': 'overwrite',
            'data': JSON.stringify(scores),
            'returnContent': 'count',
            'returnFormat': 'json'
        };

        var headers = {
            'User-Agent': 'Super Agent/0.0.1',
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        // The penalty of calling request is that we have to wait here for .5 second
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
        }, (function( tokens, self, site, num, event, scores ) {
            return function (error, response, body) { // in case we have an error, try to send again one after another
                if (error || response.statusCode !== 200) {
                    // error case
                    console.log("Error sending data (REDCap): \"" + error + "\", response:\n" + JSON.stringify(response) + "\nTRY SENDING AGAIN");
                    // It could be that instruments are locked. Find out from the response:
                    // {"statusCode":400,"body":{"error":"\"NDAR_INVBY7K856D\",\"dim_y_ss_mean_nm\",\"7\",\"This field is located on a form that is locked. You must first unlock this form for this record.\"\n\"NDAR_INVBY7K856D\",\"dim_y_ss_mean_nt\",\"7\",\"This field is located on a form that is locked. You must first unlock this form for this record.\"\n\"NDAR_INVC11YFHZV\",\"dim_y_ss_mean_nm\",\"7\",\"This field is located on a form that is locked. You must first unlock this form for this record.\"\n\"NDAR_INVC11YFHZV\",\"dim_y_ss_mean_nt\",\"7\",\"This field is located on a form that is locked. You must first unlock this form for this record.\"\n\"NDAR_INVDETM0C98\",\"dim_y_ss_mean_nm\",\"7\",\"This field is located on a form that is locked. You must first unlock this form for this record.\"\n\"NDAR_INVDETM0C98\",\"dim_y_ss_mean_nt\",\"7\",\"This field is located on a form that is locked. You must first unlock this form for this record.\"\n\"NDAR_INVEJ1P9J2M\",\"dim_y_ss_mean_nm\",\"7\",\"This field is located on a form that is locked. You must first unlock this form for this record.\"\n\"NDAR_INVEJ1P9J2M\",\"dim_y_ss_mean_nt\",\"7\",\"This field is located on a form that is locked. You must first unlock this form for this record.\"\n\"NDAR_INVFDJ5FNUB\",\"dim_y_ss_mean_nm\",\"7\",\"This field is located on a form that is locked. You must first unlock this form for this record.\"\n\"NDAR_INVFDJ5FNUB\",\"dim_y_ss_mean_nt\",\"7\",\"This field is located on a form that is locked. You must first unlock this form for this record.\""},"headers":{"date":"Fri, 08 Jun 2018 22:32:59 GMT","server":"Apache/2.4.18 (Ubuntu)","expires":"0","cache-control":"no-store, no-cache, must-revalidate","pragma":"no-cache","access-control-allow-origin":"*","redcap-random-text":"3X2Gx9svUJ6KpL3DwhPn9E9nBG9SgJ6P8xepgV","content-length":"1510","connection":"close","content-type":"application/json; charset=utf-8"},"request":{"uri":{"protocol":"https:","slashes":true,"auth":null,"host":"abcd-rc.ucsd.edu","port":443,"hostname":"abcd-rc.ucsd.edu","hash":null,"search":null,"query":null,"pathname":"/redcap/api/","path":"/redcap/api/","href":"https://abcd-rc.ucsd.edu/redcap/api/"},"method":"POST","headers":{"User-Agent":"Super Agent/0.0.1","Content-Type":"application/x-www-form-urlencoded","accept":"application/json","content-length":21065}}}
                    var errorParts = response['body']['error'].match(/NDAR_INV[^"]+/g);
                    //console.log("errorParts: " + JSON.stringify(errorParts));
                    if (errorParts.length > 0) {
                        var cleanScores = [];
                        for (var i = 0; i < scores.length; i++) {
                            if (errorParts.indexOf(scores[i]['id_redcap']) > -1)
                                continue;
                            cleanScores.push(scores[i]);
                        }
                        scores = cleanScores;
                        // our assumption is that some of the values we are trying to submit are not working - locked participants
                        // so we just commit every single value one at a time to see if we can submit other parts
                        
                        // if we have a single score, don't try again, it failed already the first time
                        if (scores.length > 1) {
                            // it would make more sense here to split the scores into two submissions (half them), that would speed up processing in error cases
                            // push twice, one the first one - if that fails stop, one the second set (everything else), if the second
                            // send fails we will remove one again and try again to prevent an endless loop
                            var oneScore = scores.shift();
                            queue.push({ token: tokens, self: self, site: site, scores: [oneScore] }, (function (site, num, event, pGUID) {
                                return function (err) {
                                    console.log("Finished sending one try again case " + pGUID + " for site " + site + " (" + event + ").");
                                };
                            })(site, num, event, oneScore['id_redcap'])); 
                            queue.push({ token: tokens, self: self, site: site, scores: scores }, (function (site, num, event) {
                                return function (err) {
                                    console.log("Finished sending all other cases for site " + site + " (" + event + ").");
                                };
                            })(site, num, event)); 
                        }
                    }
                }
            };
        })(tokens[site], this, site, num, event, scores) ) ;
        callback();
    }, 2); // Run one simultaneous download
    
    // is called after all the values have been pulled
    queue.drain = (function (self) {
        return function () {
            console.log("did send all participants to redcap ");
        };
    })(this);

    var sites = Object.keys(localScores);
    for (var i = 0; i < sites.length; i++) {
        var site = sites[i];
        var events = Object.keys(localScores[sites[i]]);
        // one call for this site
        var thisSiteData = [];
        var num = 0;
        for (var j = 0; j < events.length; j++) {
            num = num + localScores[site][events[j]].length;
            var event = events[j];
            thisSiteData.push.apply(thisSiteData, localScores[site][events[j]]);
            queue.push({ token: tokens, self: this, site: site, scores: localScores[site][events[j]] }, (function (site, num, event) {
                return function (err) {
                    if (num == 1)
                        console.log("Finished sending " + num + " data set for site " + site + " (" + event + ").");
                    else
                        console.log("Finished sending " + num + " data sets for site " + site + " (" + event + ").");
                };
            })(site, num, event));
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
        sendToREDCap({ scores: this._results }, this._pretendMode);
    }
}

RedcapPut.prototype.cleanUp = function () {
    // a change to print out results, or to send things off to someone else
    sendToREDCap( { scores: this._results }, this._pretendMode);
    console.log("Results after sending (" + this._results.length + "): \n" + JSON.stringify(this._results, null, '  '));
}


RedcapPut.prototype.endEpoch = function () {
    if (this._lastData !== null) {
        console.log("save data [" + this._results.length + "] -> " + JSON.stringify(this._lastData));
        this.addResult(this._lastData); // save the last epochs results
        this._lastData = null;
    }
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
        if (outputName !== "" && outputName !== undefined && typeof inputs[obj[i]] !== 'undefined' && inputs[obj[i]] !== undefined) {
            data[outputName] = inputs[obj[i]];
        }
    }
    // do we have something to send? (more than just the id_redcap and redcap_event_name)
    if (typeof data['id_redcap'] === 'undefined' || data['id_redcap'] === "" ||
        typeof data['redcap_event_name'] === 'undefined' || data['redcap_event_name'] === "" ||
        typeof data['redcap_data_access_group'] === 'undefined' || data['redcap_data_access_group'] === "" ) {
        //console.log("redcap_put: insufficient data, require id_redcap, redcap_event_name, and redcap_data_access_group");
        if ( (typeof data['id_redcap'] !== 'undefined' && data['id_redcap'] !== "") ||
             (typeof data['redcap_event_name'] !== 'undefined' && data['redcap_event_name'] !== "") ||
             (typeof data['redcap_data_access_group'] !== 'undefined' && data['redcap_data_access_group'] !== "") ) {
            console.log('redcap_put: insufficient data, required are id_redcap, redcap_event_name and redcap_data_access_group')
        }
    } else {
        if (Object.keys(data).length > 3) {
            this._lastData = data;
        }
    }
};

module.exports = RedcapPut;
