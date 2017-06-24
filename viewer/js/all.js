var selectedElement = null;
var items = [];
var cid_start = null;
var cid_end = null;

function SVG(tag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
}


var nodes = [];
function createGraphicForItem( item, pos ) {
    var w = 150;
    var h = 30;

    if (typeof pos === 'undefined' || pos === null) {
	if (typeof item['screen-position'] === 'undefined') {
	    alert("Error: could not read the screen location for this item");
	    return;
	}
	pos = item['screen-position']; // needs to be defined
    }

    // make a copy of the position (objects are otherwise copied as references)
    var newpos = { top: pos.top, left: pos.left };
    item['screen-position'] = newpos;
    
    var maxAddHeight = Math.max(item['inputs'].length, item['outputs'].length);
    h = h + (maxAddHeight * 14);

    //var bb0 = jQuery('#right_svg')[0].getBoundingClientRect();
    
    pos.top = pos.top - 0;
    pos.left = pos.left - 250;

    var id = 0;
    if (typeof item['gid'] === 'undefined') {
	id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
	    return v.toString(16);
	});
	item['gid'] = id;
    } else {
	id = item['gid'];
    }
	
    // create a group first for this item
    var g = jQuery(SVG('g'))
	.attr('transform', 'translate(' + pos.left + ',' + pos.top + ')')
        .attr('gid', id)
        .attr('class', 'movable draggable');
    var b = jQuery(SVG('rect'))
	.attr('y', 0)
	.attr('x', 0)
	.attr('rx', "3")
	.attr('ry', "3")
	.attr('width', w)
	.attr('height', h)
	.css("fill", "gray")
	//.css('stroke', "black")
	.css('stroke-width', 0.6)
    jQuery(g).append(b);

    // add state variables to g
    if (typeof item['state'] !== 'undefined') {
	for (var i = 0; i < item['state'].length; i++) {
	    item['state'][i]['gid'] = id;
	}
	g.attr('state', JSON.stringify(item['state']));
    }
    
    // the title text
    var title = jQuery(SVG('text'))
        .attr('font-size', '10px')
        .attr('color', '#fff')
        .attr('font-family', '"Source Sans Pro", "Helvetica Neue", Arial, Helvetica, sans-serif')
        .attr('line-height', '1.4em')
	.attr('stroke', 'none')
	.attr('x', 0)
	.attr('y', 0)
        .attr('text-anchor', 'middle')
	.attr('transform', 'translate(' + (w/2) + ',' + 13 + ')');
    jQuery(title).append(item['name']);
    jQuery(g).append(title);

    // add enable/disable
    var id2 = 0;
    if (typeof item['enabledisable-id'] === 'undefined') {	
	id2 = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
	    return v.toString(16);
	});
	item['enabledisable-id'] = id2;
    } else {
	id2 = item['enabledisable-id'];
    }
    
    var g3 = jQuery(SVG('g'))
	.attr('id', id2)
	.attr('site', 'left');
    var r = jQuery(SVG('circle'))
	.attr('r', 5)
	.attr('cx', 9)
	.attr('cy', 9)
	.attr('class', 'connectable')
	.attr('fill', "orange")
    jQuery(g3).append(r);
    jQuery(g).append(g3);

    // add delete
    var g4 = jQuery(SVG('g'))
	.attr('class', 'deleteitem');
    var r4 = jQuery(SVG('rect'))
        .attr('width', 13)
        .attr('height', 13)
	.attr('x', w-16)
	.attr('y', 3)
	.attr('class', 'deleteitem')
	.attr('stroke', 'darkgray')
	.attr('fill', 'gray')
	.attr('rx', 1)
	.attr('ry', 1);
    var t4 = jQuery(SVG('text'))
	.attr('x', w-12)
	.attr('y', 13)
	.attr('class', 'deleteitem')
	.attr('stroke', 'none')
	.attr('fill', 'orange');
    jQuery(t4).append("x");
    jQuery(g4).append(r4);
    jQuery(g4).append(t4);
    jQuery(g).append(g4);
    
    // the inputs
    for (var i = 0; i < item['inputs'].length; i++) {
	var id = 0;
	if (typeof item['inputs'][i]['id'] === 'undefined') {
	    id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	    });
	    item['inputs'][i]['id'] = id;
	} else {
	    id = item['inputs'][i]['id'];
	}
	
	var g2 = jQuery(SVG('g'))
	    .attr('class', 'input-item')
	    .attr('site', 'left')
	    .attr('id', 'port-input-' + id);
	var tt = jQuery(SVG('text'))
            .attr('font-size', '10px')
            .attr('font-family', '"Source Sans Pro", "Helvetica Neue", Arial, Helvetica, sans-serif')
            .attr('line-height', '1.4em')
	    .attr('x', 0)
	    .attr('y', 0)
            .attr('text-anchor', 'start')
	    .attr('transform', 'translate(' + 10 + ',' + (30+i*14) + ')');
	var cir = jQuery(SVG('circle'))
	    .attr('r', 4)
	    .attr('cx', 5)
	    .attr('fill', '#aaa')
	    .attr('class', 'connectable')
	    .attr('cy', 30+i*14 - 3);
	jQuery(g2).append(cir);
	jQuery(tt).append(item['inputs'][i]['name']);
	jQuery(g2).append(tt);
	jQuery(g).append(g2);
    }
    
    // the outputs
    for (var i = 0; i < item['outputs'].length; i++) {
	var id = 0;
	if (typeof item['outputs'][i]['id'] === 'undefined') {
	    id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	    });
	    item['outputs'][i]['id'] = id;
	} else {
	    id = item['outputs'][i]['id'];
	}
	
	var g2 = jQuery(SVG('g'))
	    .attr('class', 'output-item')
	    .attr('site', 'right')
	    .attr('id', 'port-output-' + id);
	var tt = jQuery(SVG('text'))
            .attr('font-size', '10px')
           .attr('font-family', '"Source Sans Pro", "Helvetica Neue", Arial, Helvetica, sans-serif')
            .attr('line-height', '1.4em')
	    .attr('x', 0)
	    .attr('y', 0)
            .attr('text-anchor', 'end')
	    .attr('transform', 'translate(' + (w-10) + ',' + (30+i*14) + ')');
	var cir = jQuery(SVG('circle'))
	    .attr('r', 4)
	    .attr('class', 'connectable')
	    .attr('fill', '#aaa')
	    .attr('cx', w-5)
	    .attr('cy', 30+i*14 - 3);
	jQuery(g2).append(cir);
	jQuery(tt).append(item['outputs'][i]['name']);
	jQuery(g2).append(tt);
	jQuery(g).append(g2);
    }    

    // add this item to the nodes list
    nodes.push(item);
    
    return g;
}

function connectionsFor( gid ) {      // return the list of all id's of connections
    var cons = []; // return this list
    // find the element in nodes
    var nodeID = -1;
    for (var i = 0; i < nodes.length; i++) {
	if (nodes[i]['gid'] == gid) {
	    nodeID = i;
	    break;
	}
    }
    if (nodeID == -1) {
	return cons;
    }
        
    // first get a list of all the connection of this element
    var potcon = [];
    for (var i = 0; i < nodes[nodeID]['inputs'].length; i++) {
	potcon.push( nodes[nodeID]['inputs'][i]['id'] );
    }
    for (var i = 0; i < nodes[nodeID]['outputs'].length; i++) {
	potcon.push( nodes[nodeID]['outputs'][i]['id'] );
    }
    potcon.push( nodes[nodeID]['enabledisable-id'] ); // could also connect to this id

    // each of these potential connection could be part of a connection in connections
    for (var i = 0; i < connections.length; i++) {
	// if a port of our node connects somewhere we would see it in this connections source or target fields
	var sid = connections[i]['source'];
	var tid = connections[i]['target'];
	for (var j = 0; j < potcon.length; j++) {
	    if (sid.indexOf(potcon[j]) !== -1) {
		// mark this connection as connected
		cons.push(connections[i]['id']);
	    }
	    if (tid.indexOf(potcon[j]) !== -1) {
		// mark this connection as connected
		cons.push(connections[i]['id']);
	    }
	}
    }
    return cons;
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


var wasMoved = false;
function fillItems() {
    jQuery.getJSON('items.json', function(data) {
	items = data;
	
	// get list of groups
	var group = {};
	for (var i = 0; i < data.length; i++) {
	    group[data[i]['group']] = "";
	}
	group = Object.keys(group);
	for (var i = 0; i < group.length; i++) {
	    jQuery('#left-up').append('<div class="list-item-group-title" id="list-item-group-title-'+group[i] + '">' + group[i] + '</div>');

	    // add all items for this group
	    for (var j = 0; j < data.length; j++) {
		if (data[j]['group'] != group[i])
		    continue;
		jQuery('#list-item-group-title-'+ group[i])
		    .append('<div class="list-item-group-entry draggable" type-id="'
			    + data[j]['id'] + '" title="' + data[j]['description'] + '">'+data[j]['name'] + '</div>');
	    }
	}
	jQuery('.draggable').draggable({
	    containment: "#right",
	    helper: 'clone',
	    opacity: 0.5
	});
	jQuery('#right').droppable({
	    drop: function(event, ui) {
		// add child here
		var pos = ui.position;
		item = jQuery(ui.helper).attr('type-id');
		for(var i = 0; i < items.length; i++) {
		    if (items[i]['id'] == item) {
			item = clone(items[i]);
			break;
		    }
		}
		//jQuery('.svg-pan-zoom_viewport').append(
		jQuery('#right_svg').append(
		    createGraphicForItem( item, pos )
		);

		return true;
	    }
	});
    });

    jQuery('#right_svg').on('mousedown', '.movable', function(e) {
	currentX = e.clientX;
	currentY = e.clientY;
	selectedElement = e.target;
	wasMoved = false;
    });
    jQuery('#right_svg').on('mousemove', '.movable', function(e) {
        if (selectedElement) {
	    // use group element
	    var t = jQuery(selectedElement).parent().attr('transform');
	    var regexp = /translate\((-*[\d\.]+),(-*[\d\.]+)\)/;
	    var res = t.match(regexp);
	    if (res.length < 3)
		return;

	    jQuery('#connects').children().remove();
	    createConnections();
	    
	    var dx = parseInt(res[1]) + e.clientX - currentX;
	    var dy = parseInt(res[2]) + e.clientY - currentY;
	    currentX = e.clientX;
	    currentY = e.clientY;
	    jQuery(selectedElement).parent().attr('transform', 'translate(' + dx + ',' + dy + ')');
	    if (dx !== 0 || dy !== 0)
  		wasMoved = true;

	    // now update the position information on the graph item
	    var id = jQuery(selectedElement).parent().attr('gid');
	    for (var i = 0; i < nodes.length; i++) {
		if (nodes[i]['gid'] == id) {
		    // update the location of this element
		    nodes[i]['screen-position'] = {left: dx+250, top: dy+0};
		    break;
		}
	    }
	    
	    //selectedElement.setAttribute("x", dx);
	    //selectedElement.setAttribute("y", dy);
	}
    });
    jQuery('#right_svg').on('mouseup', '.movable', function(e) {
	if (wasMoved) {
	    selectedElement = null;
	    return;
	}
	
	// make this item selectable
	var c = jQuery(this).attr('class').split(" ");
	var state = [];
	if (jQuery(this).attr('state')) {
            state = JSON.parse(jQuery(this).attr('state'));
	}
	if (c.indexOf("highlight") !== -1) {
	    // already highlighted
	    c.splice(c.indexOf("highlight"),1);
   	    jQuery(this).attr('class', c.join(" "));
	    // remove state from display
	    removeStateDisplay(state);	    
	} else {
	    c.push("highlight");
   	    jQuery(this).attr('class', c.join(" "));

	    // add state to display
	    state['parent-id'] = jQuery(this).attr('gid');
	    addStateDisplay(state);
	}
	selectedElement = null;
    });

    jQuery('#right_svg').on('mousedown', '.connectable', function(a) {
	cid_start = [ jQuery(this).parent().attr('id'), jQuery(this).parent().attr('site')];
	return false;
    });

    jQuery('#right_svg').on('mouseup', '.deleteitem', function(e) {
	// find out all connections to this node
	var gid = jQuery(this).parent().parent().attr('gid');
	var cons = connectionsFor( gid );

	// now we can remove this node (gid) and the connections to this node
	var idx = -1;
	for (var i = 0; i < nodes.length; i++) {
	    if (nodes[i]['gid'] == gid) {
		idx = i;
	    }
	}
	nodes.splice(idx, 1);
	// cleanup the nodes array again
	nodes = nodes.filter(function(val){return val});

	var li = connections.length;
	while (li--) { // count backwards because we will remove elements from the array
	    for (var i = 0; i < cons.length; i++) {
		if (cons[i] === connections[li]['id']) {
		    connections.splice(li,1);
		    break;
		}
	    }
	}
	// cleanup the connections array again
	connections = connections.filter(function(val){return val});

	// and update the display (don't we need a deep copy here?
	// change the state of the current graph
	var id = jQuery('#recipes-list option:selected').attr('state-id');
	recipes[id] = { nodes: nodes, connections: connections };
	createCurrentGraph( recipes[id] );
	
	return false; // don't propagate further
    });

    jQuery('#right_svg').on('mouseup', '.connectable', function(a) {
	if (cid_start != null) {
	    cid_end = jQuery(this).parent().attr('id');
	    site = jQuery(this).parent().attr('site');
	    addConnection( cid_start, [ cid_end, site] );
	    createConnections();
	}
	cid_start = null;
	cid_end = null;
	
	return false;
    });
    
}

// react to state value changes
function setupStateValues() {
    jQuery('#left-down').on('change', 'input', function(a) {
	var stateVariable = jQuery(this).parent().find('label').text();
	var newValue = jQuery(a.target).val();
	var parentID = jQuery(a.target).parent().attr('parent-id');
	// get the state from this element
	var state = null;
	var stateParent = null;
	jQuery.each(jQuery('#right_svg g'), function(index, value) {
	    if (jQuery(value).attr('gid') == parentID) {
		state = JSON.parse(jQuery(value).attr('state'));
		stateParent = value;
	    }
	});
	console.log("state is: " + JSON.stringify(state));
	// now update the state
	for (var i = 0; i < state.length; i++) {
	    if (state[i]['name'] == stateVariable) {
		state[i]['value'] = newValue;
	    }
	}
	// attach new state again to the graphical item
	jQuery(stateParent).attr('state', JSON.stringify(state));

	// the state also has to be entered into the nodes representation
	for (var i = 0; i < nodes.length; i++) {
	    if (nodes[i]['gid'] == parentID) {
		// now find the correct state variable
		for (var j = 0; j < nodes[i]['state'].length; j++) {
		    if (nodes[i]['state'][j]['name'] == stateVariable) {
			nodes[i]['state'][j]['value'] = newValue;
			break;
		    }
		}
		break;
	    }
	}
	
    });
}

function addStateDisplay( state ) {
    var parentID = state['parent-id']; // but this is an array!!
    for (var i = 0; i < state.length; i++) {
	var gid = state[i]['gid'];
	// remove any existing displays
	jQuery('#'+ gid + '-' + state[i]['name']).remove();	
	if (state[i]['type'] == "text") {
  	    jQuery('#left-down').append("<div id=\"" + gid + "-" + state[i]['name'] + "\" parent-id=\"" + parentID + "\" class=\"form-group\" style=\"width: 200px\"><label>" + state[i]['name'] + "</label><input class=\"form-control input-sm\" type=\"text\" placeholder=\"text\" value=\"" + ((typeof state[i]['value'] !== 'undefined')?state[i]['value']:"") + "\"></form>");
	}
    }
}

function removeStateDisplay( state ) {
    for (var i = 0; i < state.length; i++) {
	var gid = state[i]['gid'];
	// remove any existing displays
	jQuery('#'+ gid + '-' + state[i]['name']).remove();	
    }
}

function addConnection( cid1, cid2 ) {
    // get this parents g cid as the id for the connection

    // we only allow connections from out to in
    if (cid1[1] !== "right" || cid2[1] !== "left") {
	console.log("This connection direction is not allowed");
	return;
    }

    cid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
	return v.toString(16);
    });
    
    connections.push( { id: cid, 'source': cid1[0], 'target': cid2[0], 'source-side': cid1[1], 'target-side': cid2[1] } );
}

var connections = [];
function createConnections() {
    for (var i = 0; i < connections.length; i++) {
	str = "";
	// we need to add a path given 4 points
	var id = connections[i]['id'];
	// get the location of the two circles for the attachement points of the connection
	var bb1 = jQuery('#'+connections[i]['source']).find('circle')[0].getBoundingClientRect();
	var bb2 = jQuery('#'+connections[i]['target']).find('circle')[0].getBoundingClientRect();

	// try to get the location of the right_svg the coordinates are relative to that location
	var bb0 = jQuery('#right_svg')[0].getBoundingClientRect();
	
	var x1 = -bb0.left + (bb1.left + (bb1.width/2));
	var y1 = -bb0.top + (bb1.top + (bb1.height/2));
	var x2 = -bb0.left + (bb2.left + (bb2.width/2));
	var y2 = -bb0.top + (bb2.top + (bb2.height/2));

	var dist = 60;
	str = str + "M" + Math.round(x1) + " " + Math.round(y1) + "C " + Math.round(x1 + (connections[i]['source-side'] == "left"? -dist:dist)) + " " + Math.round(y1) + ", " +
            Math.round(x2 + (connections[i]['target-side'] == "left"?-dist:dist)) + " " + Math.round(y2) + ", " + Math.round(x2) + " " + Math.round(y2);
	var p = jQuery(SVG('path'))
	    .attr('fill', 'none')
	    .attr('stroke', 'gray')
	    .attr('stroke-width', 0.6)
	    .attr('cid', id)
	    .attr('d', str);
	jQuery('#connects').append(p);
    }
}

function getCurrentGraph() {
    var rep = {};
    
    // what elements have been loaded?
    rep['nodes'] = nodes;
    
    // what connections exist?
    rep['connections'] = connections;
    
    return rep;
}

function createCurrentGraph( rep ) {
    // delete old nodes
    var existingNodes = jQuery('#right_svg g');
    for (var i = 0; i < existingNodes.length; i++) {
	if ( typeof jQuery(existingNodes[i]).attr('class') !== 'undefined'
	     && jQuery(existingNodes[i]).attr('class').indexOf('movable') !== -1) {
  	    jQuery(existingNodes[i]).children().remove();
	}
    }
    jQuery('#connects').children().remove();
    nodes = [];
    connections = [];
    
    // now add new nodes
    for (var i = 0; i < rep['nodes'].length; i++) {
	jQuery('#right_svg').append(
	    createGraphicForItem(rep['nodes'][i], null)
	);
    }
    connections = rep['connections'];
    createConnections();
    selectedElement = null;
}

function createScreenshot() {
    // get the screen shot of the current graph (might only work on Chrome)
    var svgString = new XMLSerializer().serializeToString(document.querySelector('svg'));
    svgString = svgString.replace(/width: 4000/, "width: 800");
    svgString = svgString.replace(/height: 4000/, "height: 800");
    svgString = svgString.replace(/width=\"4000\"/, "width=\"800\"");
    svgString = svgString.replace(/height=\"4000\"/, "height=\"800\"");
    
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    var DOMURL = self.URL || self.webkitURL || self;
    var img = new Image();
    var svg = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    var url = DOMURL.createObjectURL(svg);
    img.onload = function () {
	ctx.drawImage(img, 0, 0);
	var png = canvas.toDataURL("image/png");
	png = png.replace(/^data:image\/(png|jpg);base64,/, "")
	// Sending the image data to Server
	jQuery.post('getRecipes.php?action=saveImage&name=' + jQuery('#new-name').val().replace(/\s+/g, '_') + ".png",
		    { "imageData" : encodeURIComponent(png) },
		    function(msg) { console.log(msg); }
		   );
	/*$.ajax({
	    type: 'POST',
	    url: 'getRecipes.php?action=saveImage&name=' + jQuery('#new-name').val().replace(/\s+/g, '_') + ".png",
	    data: { "imageData" : encodeURIComponent(png) },
	    contentType: 'application/json; charset=utf-8',
	    dataType: 'json',
	    success: function (msg) {
		alert("Done, Picture Uploaded.");
	    },
	    fail: function(msg) {
		alert("ERROR on sending image"+ msg);
	    }
	}); */
	document.querySelector('#png-container').innerHTML = '<img src="' + png + '"/>';
	DOMURL.revokeObjectURL(png);
    };
    img.src = url;
}

var recipes = [];

jQuery(document).ready(function() {
    jQuery('.select2').select2({});
    fillItems();
    setupStateValues();

    jQuery.getJSON('getRecipes.php', function(data) {
	recipes = data;
	var obj = Object.keys(data);
	for (var i = 0; i < obj.length; i++) {
   	    jQuery('#recipes-list').append("<option state-id=\"" + obj[i] + "\">" + obj[i] + "</option>");    
	}

	if (typeof loadRecipe !== 'undefined' && loadRecipe !== "") {
	    // load this model
	    jQuery('#recipes-list').val(loadRecipe).trigger('change');
	    /* var resNames = Object.keys(recipes);
	    for (var i = 0; i < resNames.length; i++) {
		
		if (resNames[i] === loadRecipe) {
		    var state = recipes[resNames[i]];
		    createCurrentGraph( state );
		    // we should select the id in the list as well
		}
	    } */
	}
	
	
    });

    jQuery('#recipes-list').on('change', function() {
	var id = jQuery('#recipes-list option:selected').attr('state-id');
	console.log('change to a different state: \"' + id + '\"');
	var state = recipes[id];
	createCurrentGraph( state );
    });

	jQuery('#save-recipe-button').click(function () {
		console.log(" saved in the dialog");
		var state = getCurrentGraph();
		jQuery.ajax({
			url: 'getRecipes.php?action=save&name=' + jQuery('#new-name').val().replace(/\s+/g, '_'),
			data: { 'state': JSON.stringify(state) },
			dataType: 'json',
			method: 'POST'
		});
		// create a screenshot of this recipe and save as well
		createScreenshot();

		jQuery('#save-recipe-dialog').modal('hide');
	});

    jQuery('#delete-recipe').click(function() {
	var id = jQuery('#recipes-list option:selected').attr('state-id');
	jQuery.get('getRecipes.php?action=delete&name=' + id, function(data) {
	    console.log("got message back:" + data['message']);
	});
    });

    jQuery('#create-new-recipe').click(function() {
	jQuery('#recipes-list').val('').trigger('change');
	console.log("new entry ");
	nodes = [];
	connections = [];
    });
});
