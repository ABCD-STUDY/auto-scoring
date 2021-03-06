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
        .attr('filter', 'url(#f1)')
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
	g.attr('state', encodeURIComponent(JSON.stringify(item['state'])));
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
        .attr('stroke', '#333')
	    .attr('stroke-width', 0.5)
	    .attr('class', 'connectable')
	    .attr('fill', "orange")
    var powerg = jQuery(SVG('g'))
	    .attr('transform', 'translate(5.8,5.5) scale(0.018)');
    var powerg1 = jQuery(SVG('g'));
    var powerg2 = jQuery(SVG('g'));
    var one = jQuery(SVG('path'))
	    .attr('stroke', 'none')
	    .attr('fill', '#ee7600')
	    .attr('d', 'M174.787,349.574c-85.468,0-155-69.531-155-155c0-49.915,24.27-97.069,64.92-126.142 c10.997-7.861,26.282-5.323,34.142,5.674c7.864,10.995,5.326,26.281-5.67,34.142c-27.829,19.902-44.446,52.174-44.446,86.326 c0,58.482,47.575,106.054,106.054,106.054s106.054-47.571,106.054-106.054c0-34.152-16.617-66.424-44.446-86.326 c-10.996-7.86-13.534-23.146-5.67-34.142c7.86-10.996,23.146-13.535,34.142-5.674c40.65,29.072,64.92,76.227,64.92,126.142 C329.787,280.043,260.255,349.574,174.787,349.574z');
    jQuery(powerg1).append(one);
    jQuery(powerg).append(powerg1);
    jQuery(powerg).append(powerg2);
    var two = jQuery(SVG('path'))
	    .attr('stroke', 'none')
	    .attr('fill', '#ee7600')
	    .attr('d', 'M174.787,187.631c-13.516,0-24.473-10.957-24.473-24.477V24.47c0-13.513,10.957-24.47,24.473-24.47 s24.473,10.957,24.473,24.47v138.685C199.26,176.674,188.303,187.631,174.787,187.631z');
    jQuery(powerg2).append(two);
    
    jQuery(g3).append(r);
    jQuery(g3).append(powerg);
    jQuery(g).append(g3);
    
    var close = jQuery(SVG('g'))
	    .attr('width', '50')
	    .attr('height', '50')
	    .attr('class', 'deleteitem')
	    .attr('transform', 'translate(' + (w-16) + ',3) scale(0.25,0.25)')
	    .attr('viewBox', '0 0 50 50');
    jQuery(g).append(close);
    var close_g = jQuery(SVG('g'));
    jQuery(close).append(close_g);
    var close_p1 = jQuery(SVG('path'))
	    .attr('d', 'M50,45.233C50,47.866,47.866,50,45.233,50H4.767C2.134,50,0,47.866,0,45.233V4.767     C0,2.134,2.134,0,4.767,0h40.466C47.866,0,50,2.134,50,4.767V45.233z')
	    .attr('fill', '#999');
    jQuery(close_g).append(close_p1);
    var close_p2 = jQuery(SVG('path'))
	    .attr('d', 'M37.029,15.342L15.342,37.029L28.313,50h16.92C47.866,50,50,47.866,50,45.233v-16.92L37.029,15.342z')
	    .attr('opacity', '0.2');
    jQuery(close_g).append(close_p2);
    var close_gg = jQuery(SVG('g'));
    jQuery(close_g).append(close_gg);
    var close_gg_p = jQuery(SVG('path'))
	    .attr('d', 'M37.029,32.482c0.601,0.601,0.601,1.576,0,2.177l-2.371,2.371c-0.601,0.601-1.576,0.601-2.177,0      L12.971,17.518c-0.601-0.601-0.601-1.576,0-2.177l2.371-2.371c0.601-0.601,1.576-0.601,2.177,0L37.029,32.482z')
	    .attr('fill', '#FFF');
    jQuery(close_gg).append(close_gg_p);
    var close_gg_p2 = jQuery(SVG('path'))
	    .attr('d', 'M32.482,12.971c0.601-0.601,1.576-0.601,2.177,0l2.371,2.371c0.601,0.601,0.601,1.576,0,2.177      L17.518,37.029c-0.601,0.601-1.576,0.601-2.177,0l-2.371-2.371c-0.601-0.601-0.601-1.576,0-2.177L32.482,12.971z')
	    .attr('fill', '#FFF');
    jQuery(close_gg).append(close_gg_p2);
    
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
	        .attr('fill', 'rgba(200,200,200,.6)')
	        .attr('class', 'connectable')
	        .attr('cy', 30+i*14 - 3);
	    var arrowg = jQuery(SVG('g'))
	        .attr('stroke', 'none')
	        .attr('stroke-width', 1)
	        .attr('transform', 'translate(2.5,' + (30+i*14 - 5.3) + ') scale(0.3)')
	        .attr('fill', 'none');
	    var arrow = jQuery(SVG('path'))
	        .attr('d', 'M16.818,7.646 L10.878,2.206 C10.644,1.992 10.264,1.993 10.029,2.208 L10.024,6.001 L2,6.001 C1.447,6.001 1,6.448 1,7.001 L1,9.001 C1,9.554 1.447,10.001 2,10.001 L10.019,10.001 L10.013,13.878 C10.245,14.091 10.626,14.09 10.862,13.875 L16.816,8.423 C17.049,8.206 17.052,7.859 16.818,7.646 L16.818,7.646 Z')
	        .attr('fill','#EEE');
	    jQuery(arrowg).append(arrow);
	    jQuery(g2).append(arrowg);
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
	        .attr('fill', 'rgba(200,200,200,.6)')
	        .attr('cx', w-5)
	        .attr('cy', 30+i*14 - 3);
	    var arrowg = jQuery(SVG('g'))
	        .attr('stroke', 'none')
	        .attr('stroke-width', 1)
	        .attr('transform', 'translate(' + (w-8) + ',' + (30+i*14 - 5.3) + ') scale(0.3)')
	        .attr('fill', 'none');
	    var arrow = jQuery(SVG('path'))
	        .attr('d', 'M16.818,7.646 L10.878,2.206 C10.644,1.992 10.264,1.993 10.029,2.208 L10.024,6.001 L2,6.001 C1.447,6.001 1,6.448 1,7.001 L1,9.001 C1,9.554 1.447,10.001 2,10.001 L10.019,10.001 L10.013,13.878 C10.245,14.091 10.626,14.09 10.862,13.875 L16.816,8.423 C17.049,8.206 17.052,7.859 16.818,7.646 L16.818,7.646 Z')
	        .attr('fill','#EEE');
	    jQuery(arrowg).append(arrow);
	    jQuery(g2).append(arrowg);
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
    jQuery.getJSON('items.json?_=99', function(data) {
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
	        opacity: 0.5,
            scroll: false
	    });
	    jQuery('#right').droppable({
	        drop: function(event, ui) {
		        // add child here
		        var pos = ui.position;
		        pos.top = pos.top + jQuery(this).scrollTop();
		        pos.left = pos.left + jQuery(this).scrollLeft();
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
    jQuery('#right_svg').on('mousemove', function(e) {
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
	        // snap to grid
	        //dx = Math.round(Math.round(dx/5)*5);
	        //dy = Math.round(Math.round(dy/5)*5);
	        
	        currentX = e.clientX;
	        currentY = e.clientY;
	        jQuery(selectedElement).parent().attr('transform', 'translate(' + dx + ',' + dy + ')');
	        if (Math.abs(dx) <= 4 || Math.abs(dy) <= 4)
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
		state = JSON.parse(decodeURIComponent(jQuery(this).attr('state')));
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
	    var gid = jQuery(this).parent().attr('gid');
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
        
	    // lets remove the status interface elements for this node
	    jQuery('#left-down').children().each(function(a,b) {
	        var parentid = jQuery(b).attr('parent-id');
	        if (parentid == gid) {
		        jQuery(b).remove();
	        }
	    });
        
	    
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
    jQuery('#left-down').on('change', '.state-input', function(a) {
	var stateVariable = jQuery(this).parent().find('label').text();
	var newValue = jQuery(a.target).val();
	if (jQuery(a.target).is("textarea")) {
	    newValue = jQuery(a.target).data('text'); // do we need to do something different here for textarea elements?
	}
	    var parentID = jQuery(a.target).parent().attr('parent-id');
	    // get the state from this element
	    var state = null;
	    var stateParent = null;
	    jQuery.each(jQuery('#right_svg g'), function(index, value) {
	        if (jQuery(value).attr('gid') == parentID) {
		    state = JSON.parse(decodeURIComponent(jQuery(value).attr('state')));
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
   	    jQuery(stateParent).attr('state', encodeURIComponent(JSON.stringify(state)));
        
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
  	        jQuery('#left-down').append("<div id=\"" + gid + "-" + state[i]['name'] +
                                        "\" parent-id=\"" + parentID + "\" class=\"form-group\" style=\"width: 200px\"><label>" +
                                        state[i]['name'] +
                                        "</label><input class=\"form-control input-sm state-input\" type=\"text\" placeholder=\"undefined\" value=\"" +
                                        ((typeof state[i]['value'] !== 'undefined')?state[i]['value']:"") + "\"></div>");
	    } else if (state[i]['type'] == "textarea") {
	        var text = (typeof state[i]['value'] !== 'undefined')?state[i]['value']:"";
  	        jQuery('#left-down').append("<div id=\"" + gid + "-" + state[i]['name'] +
					    "\" parent-id=\"" + parentID + "\" class=\"form-group\" style=\"width: 200px\"><label title='" + parentID + "'>" +
					    state[i]['name'] +
					    "</label>" + "<button class=\"btn btn-sm btn-default edit-source-button\" style='float: right;' data-toggle=\"modal\" data-target=\"#edit-source-dialog\">edit</button>" + 
                                            "<textarea class=\"form-control input-sm state-input\" type=\"textarea\" rows=\"5\" " +
					    "placeholder=\"undefined\"></textarea></div>");
		jQuery('#' + gid + "-" + state[i]['name']).find('textarea').val(text);
		jQuery('#' + gid + "-" + state[i]['name']).find('textarea').attr('value', encodeURIComponent(JSON.stringify(text)));
		jQuery('#' + gid + "-" + state[i]['name']).find('textarea').data("text", text);
		
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
        //            .attr('filter', 'url(#f1)')
	        .attr('fill', 'none')
	        .attr('stroke', 'gray')
	        .attr('stroke-width', 0.8)
	        .attr('cid', id)
	        .attr('d', str);
	    jQuery('#connects').append(p);
        
	    var marker = jQuery(SVG('circle'))
	        .attr('class', 'marker')
	        .attr('r',1)
	        .attr('cx', 0)
	        .attr('cy', 0)
	        .css('offset-path', 'path("' + str + '")')
	        .css('animation', 'move 3s linear infinite')
	        .css('animation-name', 'move')
	        .css('animation-iteration-count', 'infinite')
	        .attr('fill', 'grey');
	    jQuery('#connects').append(marker);
	    
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

function pickQuote() {
    quotes = [ "Each life is made up of mistakes and learning, waiting and growing, practicing patience and being persistent.",
	           "Patience is a virtue, and I'm learning patience. It's a tough lesson.",
	           "Qualities you need to get through medical school and residency: Discipline. Patience. Perseverance. A willingness to forgo sleep. A penchant for sadomasochism. Ability to weather crises of faith and self-confidence. Accept exhaustion as fact of life. Addiction to caffeine a definite plus. Unfailing optimism that the end is in sight.",
	           "I am patient with stupidity but not with those who are proud of it.",
	           "We could never learn to be brave and patient, if there were only joy in the world.",
	           "He who rides the sea of the Nile must have sails woven of patience.",
	           "Endurance is nobler than strength, and patience than beauty.",
	           "Deliberately seek opportunities for kindness, sympathy, and patience.",
	           "Beware the fury of a patient man.",
	           "Patience is the ability to idle your motor when you feel like stripping your gears.",
	           "As for goals, I don't set myself those anymore. I'm not one of these 'I must have achieved this and that by next year' kind of writers. I take things as they come and find that patience and persistence tend to win out in the end.",
	           "If you would know strength and patience, welcome the company of trees.",
	           "How can a society that exists on instant mashed potatoes, packaged cake mixes, frozen dinners, and instant cameras teach patience to its young?",
	           "I think we can all use a little more patience. I get a little impatient sometimes and I wish I didn't. I really need to be more patient."
	         ];
    
    var typed = new Typed('#wait-dialog p', {
	    strings: quotes,
	    typeSpeed: 100,
	    shuffle: true
    });
    
}

var debCurrentKey = "";
var debCurrentStep = -1;
var debCurrentBuffer = [];
function debForward() {
    if (debCurrentStep === -1) {
	    jQuery('#wait-dialog').modal('show');
	    setTimeout( function() { pickQuote(); }, 200);
	    jQuery('#console').fadeIn();
	    jQuery('#console textarea').val("");
	    // first time we would start by getting a key
	    jQuery.getJSON('debugger.php', { 'action': 'start' }, function(data) {
	        debCurrentKey = data['key'];
	        jQuery.getJSON('debugger.php',
			               {
		                       'action': 'step',
		                       'key': debCurrentKey,
		                       'numSteps': 1000, // do enough steps to get some useful data from redcap
		                       'recipe': jQuery('#recipes-list').val()
	                       },
			               function(data) {
			                   // fills in the current step buffer
			                   var buffer = data['result'];
			                   for (var i = 0; i < buffer.length; i++) {
				                   debCurrentBuffer.push(buffer[i]);
				                   //jQuery('#console textarea').val(jQuery('#console textarea').val() + "\n" + JSON.stringify(buffer[i]));
			                   }
			                   setTimeout(function() {
				                   var elementsOfInterest = debCurrentBuffer.filter(function(a) { if (a['node-id'] == 'redcap-measure-put') return true; return false; });
				                   elementsOfInterest = elementsOfInterest.map(function(a) {
				                       var k = Object.keys(a['inputs']);
				                       var str = "'line': " + (a['line']-1) + " -> ";
				                       for (var i = 0; i < k.length; i++) {
					                       str = str + k[i] + ": '" + a['inputs'][k[i]] + "'";
					                       if (i < k.length-1)
					                           str = str + ", ";
				                       }
				                       return str;
				                   });
				                   jQuery('#console textarea').val( JSON.stringify(elementsOfInterest, null, 2));
			                   }, 1000);
			                   debCurrentStep++;
			                   debShowStep();
			                   jQuery('#wait-dialog').modal('hide');
			               });
	    });
	    return;
    }
    if (debCurrentStep >= debCurrentBuffer.length) {
	    // pause the interface - wait for the new data
	    jQuery('#wait-dialog').modal('show');
	    setTimeout( function() { pickQuote(); }, 200);
	    jQuery.getJSON('debugger.php',
		               { 'action': 'step', 'key': debCurrentKey, 'numSteps': 10, 'recipe': jQuery('#recipes-list').val() },
		               function(data) {
			               console.log("got the following data: " +JSON.stringify(data));
			               var buffer = data['result'];
			               for (var i = 0; i < buffer.length; i++) {
			                   debCurrentBuffer.push(buffer[i]);
			                   //jQuery('#console textarea').val(jQuery('#console textarea').val() + "\n" + JSON.stringify(buffer[i]));
			               }
			               setTimeout(function() {
			                   var elementsOfInterest = debCurrentBuffer.filter(function(b) { if (b['node-id'] == 'redcap-measure-put') return true; return false; });
			                   elementsOfInterest = elementsOfInterest.map(function(a) {
				                   var k = Object.keys(a['inputs']);
				                   var str = "'line': " + (a['line']-1) + " -> ";
				                   for (var i = 0; i < k.length; i++) {
				                       str = str + k[i] + ": '" + a['inputs'][k[i]] + "'";
				                       if (i < k.length-1)
					                       str = str + ", ";
				                   }
				                   return str;
			                   });
			                   jQuery('#console textarea').val(JSON.stringify(elementsOfInterest, null, 2));
			               }, 1000);
			               jQuery('#wait-dialog').modal('hide');
			               debCurrentStep++;
			               debShowStep();
		               });	
    } else {
	    debCurrentStep++;
	    debShowStep();
    }
}

// anchor is 'start' or 'end'
function drawValues(node, values, show_at) {
    var x = 0;
    var y = 0;
    
    var keys = Object.keys(values);
    var bb0 = jQuery('#right_svg')[0].getBoundingClientRect();
    for (var i = 0; i < keys.length; i++) {
	    var value = values[keys[i]];
	    var key = keys[i];
        
	    // does the key exists in the the list of ports?
	    var listOfPorts = jQuery('[gid="' + node['gid'] + '"]').find('text').map(function(a) {
	        return jQuery(this).text();
	    });
	    if (jQuery.inArray(key, listOfPorts) === -1) {
	        // there is an alternative, the values array could contain the same number of entries as the
	        // state array of this node. In that case use as key the key that is in the same order
	        if (typeof node['state'] !== 'undefined') { 
		        for (var j = 0; j < node['state'].length; j++) {
		            if (node['state'][j]['value'] === key) {
			            key = node['outputs'][j]['name'];
			            break;
		            }
		        }
	        }
	    }
	    
	    // find that item in svg and get its getBoundingClientRect()
	    jQuery('[gid="' + node['gid'] + '"]').find('text').each(function() {
	        var text   = jQuery(this).text();
	        var anchor = jQuery(this).attr('text-anchor');
	        var pos    = jQuery(this)[0].getBoundingClientRect();
	        if ( text !== key ) {
		        return;
	        }
	        y = parseInt( -bb0.top  + (pos.bottom));
	        var order = 'middle';
	        if (anchor == "end") {
		        // move to the right
		        x = parseInt( -bb0.left + pos.right );
		        x = x + 20;
		        order = 'start';
	        } else {
		        x = parseInt( -bb0.left + pos.left );
		        x = x - 20;
		        order = 'end';
	        }
            if (typeof show_at !== 'undefined' && order != show_at)
                return;
	        
	        var t = jQuery(SVG('text'))
		        .attr('font-size', '16px')
		        .attr('fill', '#F26D21')
		        .attr('font-family', '"Source Sans Pro", "Helvetica Neue", Arial, Helvetica, sans-serif')
		        .attr('line-height', '1.4em')
		        .attr('font-weight', 800)
		        .attr('stroke', 'black')
		        .attr('stroke-width', '0.5px')
		        .attr('x', x)
		        .attr('y', y)
		        .attr('text-anchor', order);
	        
	        if (value === "") {
		        value = "[ ]";
	        }
	        jQuery(t).append(value);
	        
	        // add to #debugging node
	        jQuery('#debugging').append(t);
	    });
	    
    }
}

function debShowStep( ) {
    if (typeof debCurrentBuffer[debCurrentStep] === 'undefined') {
	    return;
    }
    
    // visualize the current step
    //console.log('step: ' + debCurrentStep + ' is ' + JSON.stringify(debCurrentBuffer[debCurrentStep]));
    
    var entry = debCurrentBuffer[debCurrentStep];
    var gid = entry['node-gid'];
    var inputs  = entry['inputs'];
    var outputs = entry['outputs'];
    
    // find this gid in the list of nodes
    var node = null;
    for (var i = 0; i < nodes.length; i++) {
	    if (nodes[i]['gid'] == gid) {
	        node = nodes[i];
	        break;
	    }
    }
    if (node == null) {
	    console.log('unknown node found ' + gid);
	    return;
    }
    
    // for that nodes inputs draw the different values
    jQuery('#debugging').children().remove();
    if ( ! (Object.keys(inputs).length === 0) )
	    drawValues(node, inputs, 'end');
    if ( ! (Object.keys(outputs).length === 0) )
	    drawValues(node, outputs, 'start');
    
    // update the epoch and step numbers
    jQuery('#deb-epoch').val(entry['epoch']);
    jQuery('#deb-step').val(debCurrentStep);
    
    // move the cursor in the console window to this location
    var searchTerm = "'line': " + debCurrentStep + " "; // the searched word
    var posi = jQuery('#console textarea').val().indexOf(searchTerm); // take the position of the word in the text
    if (posi != -1) {
	    var target = document.getElementById("console-textarea");
	    // select the textarea and the word
	    target.focus();
	    if (target.setSelectionRange)
	        target.setSelectionRange(posi, posi+searchTerm.length);
	    else {
	        var r = target.createTextRange();
	        r.collapse(true);
	        r.moveEnd('character',  posi+searchTerm);
	        r.moveStart('character', posi);
	        r.select();
	    }
	    var objDiv = document.getElementById("console-textarea");
	    var sh = objDiv.scrollHeight; //height in pixel of the textarea (n_rows*line_height)
	    var line_ht = jQuery('#console-textarea').css('line-height').replace('px',''); //height in pixel of each row
	    var n_lines = sh/line_ht; // the total amount of lines
	    var char_in_line = jQuery('#console-textarea').val().length / n_lines; // amount of chars for each line
	    var height = Math.floor(posi/char_in_line); // amount of lines in the textarea
	    jQuery('#console-textarea').scrollTop(height*line_ht); // scroll to the selected line
    } /*else {
	    console.log('search term step not found');
    }*/
    
}

function debBackward() {
    if (debCurrentStep <= 0) {
	return; // done
    }
    debCurrentStep--;
    debShowStep();
}

function debStop() {
    jQuery('#console').fadeOut();
    jQuery('#console textarea').val("");
    jQuery.getJSON('debugger.php', { 'action': 'stop', 'key': debCurrentKey });
    debCurrentBuffer = [];
    jQuery('#debugging-tools').fadeOut();
    debCurrentStep = -1;
    debCurrentKey = "";
    jQuery('#debugging').children().remove();
    jQuery('#deb-epoch').val("");
    jQuery('#deb-step').val("");
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
var editor = ace.edit("editor");

jQuery(document).ready(function() {

    editor.setTheme("ace/theme/monokai");
    editor.session.setMode("ace/mode/r");
    editor.setOptions({
        fontSize: "14pt",
        showGutter: true
    });
    
    jQuery('.custom-menu').on('click', '.remove-connection', function() {
	    // remove a connection
	    var a = jQuery(this).attr('node-id');
	    console.log("remove a port now: " + a);
	    
        var li = connections.length;
	    while (li--) { // count backwards because we will remove elements from the array
	        if (a === connections[li]['id']) {
		        connections.splice(li,1);
		        break;
	        }
	    }
	    // cleanup the connections array again
	    connections = connections.filter(function(val){return val});
	    // and update the display (don't we need a deep copy here?
	    // change the state of the current graph
        
	    var id = jQuery('#recipes-list option:selected').attr('state-id');
	    recipes[id] = { nodes: nodes, connections: connections };
	    createCurrentGraph( recipes[id] );
	    jQuery('.custom-menu').hide();
    });
    // work in progress
    jQuery('#right_svg').bind("contextmenu", function (event) {
	    if (jQuery(event.target).parent().attr('class') !== 'input-item')
	        return true;
        
	    jQuery('.custom-menu').children().remove();
	    // find out what connection we have here - create those in .custom-menu
	    var id = jQuery(event.target).parent().attr('id');
	    console.log("got a gid: " + id);
	    var cons = [];
	    for (var i = 0; i < connections.length; i++) {
	        var c = connections[i];
	        if (c['source'] == id) {
		        // found the connection
		        jQuery('.custom-menu').append("<li class=\"remove-connection\" data-action=\"something\" node-id=\"" + c['id'] + "\">delete: " + id + "</li>");
		        // maybe better to highlight the connection
	        }
	        if (c['target'] == id) {
		        // found the connection
		        jQuery('.custom-menu').append("<li class=\"remove-connection\" data-action=\"something\" node-id=\"" + c['id'] + "\">delete: " + id + "</li>");
	        }
	    }
	    
	    // Avoid the real one
	    event.preventDefault();
        
	    // Show contextmenu
	    $(".custom-menu").finish().toggle(100).
            
	    // In the right position (the mouse)
	    css({
	        top: event.pageY + "px",
	        left: event.pageX + "px"
	    });
    });
    
    $("#right_svg .custom-menu li").click(function(){
	    
	    // This is the triggered action name
	    switch($(this).attr("data-action")) {
	        
	        // A case for each action. Your actions here
	    case "first": alert("first"); break;
	    case "second": alert("second"); break;
	    case "third": alert("third"); break;
	    }
	    
	    // Hide it AFTER the action was triggered
	    $(".custom-menu").hide(100);
    });
    
    // If the document is clicked somewhere
    $(document).bind("mousedown", function (e) {
        
	    // If the clicked element is not the menu
	    if (!$(e.target).parents(".custom-menu").length > 0) {
            
	        // Hide it
	        $(".custom-menu").hide(100);
	    }
    });
    
    
    jQuery('.select2').select2({});
    fillItems();
    setupStateValues();
    
    jQuery('#save-new-recipe').on('click', function() {
	    // copy the value of the current instrument to the interface
	    jQuery('#new-name').val( jQuery('#recipes-list').val() );
    });
    
    jQuery('#debugging-tools').hide();
    jQuery('#start-debugging').on('click', function() {
	    // toggle debugging tools
	    if (jQuery('#debugging-tools').is(":visible") ) {
	        jQuery('#debugging-tools').fadeOut();
	        // clean up
	        jQuery('#debugging-stop').trigger('click');
	    } else {
	        jQuery('#debugging-tools').fadeIn();
	    }
    });
    jQuery('#deb-step').on('change', function() {
	    var value = jQuery('#deb-step').val();
	    if (value === debCurrentStep)
	        return;
	    // change values by simulating button clicks
	    var steps = Math.abs(value - debCurrentStep);
	    if (value > debCurrentStep) {
	        for (var i = 0; i < steps; i++) {
		        debForward();
	        }
	    } else {
	        for (var i = 0; i < steps; i++) {
		        debBackward();
	        }
	    }
    });
    jQuery('#deb-epoch').on('change', function() {
	    var value = jQuery('#deb-epoch').val();
	    var currentEpoch = debCurrentBuffer[debCurrentStep]['epoch'];
	    if (value === currentEpoch)
	        return;
        
	    // change values by simulating button clicks
	    if (value > currentEpoch) {
	        while( debCurrentBuffer[debCurrentStep]['epoch'] < value) {
		        debForward();
	        }
	    } else {
	        while( debCurrentBuffer[debCurrentStep]['epoch'] > value) {
		        debBackward();
	        }
	    }
    });
    
    
    jQuery('#debugging-step-forward').on('click', function() {
	    debForward();
    });
    jQuery('#debugging-step-backward').on('click', function() {
	    debBackward();	
    });
    jQuery('#debugging-stop').on('click', function() {
	    debStop();
    });
    
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
			data: { 'state': encodeURIComponent(JSON.stringify(state)) },
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

    jQuery('body').on('click', 'button.edit-source-button', function() {
        // add the source code for this source
        //var t = jQuery(this).parent().find('textarea').val();
        var t = jQuery(this).parent().find('textarea').data("text");
        editor.setValue(t);
        // remember the id
        jQuery('#save-source-button').attr('source-id', jQuery(this).parent().attr('id'));
    });

    jQuery('#save-source-button').click(function() {
        var t = editor.getValue();
	// we need to savely copy the value .. stringify is not enough and it could contain special characters not save to store in a DOM element
	
        // copy back to the appropriate source
        var source = jQuery('#save-source-button').attr('source-id');
        //jQuery('#'+source).find('textarea').val(t).trigger('change');
	jQuery('#'+source).find('textarea').data("text", t).trigger('change');
    });
});
