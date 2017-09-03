# Auto-scoring

This project comes in two parts - a viewer for viewing, editing and debugging algorithms (called recipes) and a runner for running recipes (see [here](runner/readme.md)). The top-level web-page is used to show the list of existing recipes.

![List of recipes](https://github.com/ABCD-STUDY/auto-scoring/raw/master/images/auto-scoring.png)

There are some dependencies in the code to pieces used in the ABCD report framework. This includes a role-based user account system (AC.php) which you should disable in the source code of the index.php scripts if you don't have it. There is also a separate tokens.json file that we cannot share here. It contains the access tokens required for the program to interface with the electronic record system (REDCap).

## Viewer

The viewer is used to create a data flow graph using visual programming. Its design has been influenced by other existing visual data processing interfaces such as the one from ThreeNodes.js and Amira.

Generally data flows from left to right through "connections" between processing steps called "nodes". Each node has a list of incoming ports on the left and outgoing ports on the right (and a list of internal state variables). As an example the compute node calculating the mean of its inputs has 10 input ports that may or may not be connected to something. The three output ports represent the mean of the connected inputs, the number of missing (empty string) connected values and the total number of connected values respectively.

![The viewer used to edit recipes](https://github.com/ABCD-STUDY/auto-scoring/raw/master/images/viewer.png)

Drag- and drop a node from the list on the left to the canvas to instantiate the node. Drag- and drop using the gray port circles on each node to create a connection. Select a node to get a list of the internal state variables on the left.

The interface of each node is defined in the items.json file. Here an example of one nodes specification:
```JSON
{
    "name": "If-Else",
    "id": "if-else",
    "group": "Logic",
    "description": "If-then-else",
    "inputs": [
	{ "name": "condition" },
	{ "name": "a" },
	{ "name": "b" }
    ],
    "outputs": [
	{ "name": "true" },
	{ "name": "false" }
    ],
    "state": [
	{ "name": "a" },
	{ "name": "b" }
    ]
}
```
The structure contains three lists: inputs, outputs and state that define the interface of the node. Inputs and outputs are translated into ports that have a name and a connection circle. The state list is displayed on the left hand side of the interface if a node is selected (mouse click without mouse move). Usually state variables are used to provide default values for an input or output port. In the case of the redcap_get.js node the state variable identify the names of REDCap variables that should be used for processing. In the case of the If-Else.js node the state variables can be set to provide default values for the 'a' or 'b' input ports. State variables in the If-Else node are overwritten by data arriving at the node over connections from other nodes.

Nodes have two special visual elements at the top. The orange circle on the left is an enabler connection. Anything connecting to this special port will disable the node if its evaluated to 'false' or '0'. The cross icon on the top right of each node can be used to remove the node. All the connection from and to this node will also be removed.

There is currently no way to remove an individual connection between two ports. As a work-around remove the node on one end and add it again.

Save and load recipes from the select2 control on the top left of the page. Only Chrome browsers are currently able to create a screenshot of the recipe during the save operation. Both the recipe and its picture are stored in the recipes/ folder of the viewer sub-directory.

### Debugging a recipe
The "Debug" menu entry will start a new visual debugging session. During the session the runner will be called intermittendly to create a full history of a run. The web-page shows at each step the value of the currently evaluated node.


## Runner

The runner is a nodejs program that will run a recipe. Whereas the viewer is a very generic component that might be easily adjusted to different use cases the runner is specialized.

In the context of this project sets of input values represent raw scores for participants that need to be processed and produce sets of output values that represent derived scores. The derived scores are added back to the database. The processing of a single set of input values is handeled in an 'epoch'. During the epoch all nodes of the graph are evaluated randomly (default evaluation strategy) until no change in any single nodes inputs, outputs or internal state variables is observed. This ends the epoch. In the next epoch another set of input variables is selected for processing. Epochs end if no more sets are available for processing.

If a node fetches or saves data to and from the graph it should defines the epoch-interface functions. Other (stateless) processing nodes do not have to implement this interface and can depend on their input ports for processing. For example the redcap_get.js node will pull a list of participant scores from REDCap and needs to react to changes in epochs to switch from one dataset to the next. This way a single participants data is processed during one epoch. During that epoch the outputs of the redcap_get.js node should be the values for the current participants raw scores.

Epoch information is also used by the output node redcap_put.js. This node caches the calculated values from the end of the last epoch to prevent partially calculated values during the random execution of the graph. No special care is taken currently to prevent cycles in the graph. They can be created and might result in an endless loop if input, output, or internal state variables are changed.

Nodes that do not represent inputs our outputs to the recipe are simplier. They only observe their input and output dictionaries, possibly utilizing state variables. Here an example of the implementation of the If-Else node:
```javascript
  var IfElse = function () { }; // constructor

  // compute				  
  IfElse.prototype.work = function (inputs, outputs, state) {
      var a = null; // a value
      var b = null; // a value
      var condition = null; // a comparison function

      if (typeof state[0]['value'] !== 'undefined')
  	   a = state[0]['value'];
      if (typeof state[1]['value'] !== 'undefined')
  	   b = state[1]['value'];

      // if we have a connection (input) instead use that one - not the internal state
      if (typeof inputs['condition'] !== 'undefined')
  	   condition = inputs['condition'];
      if (typeof inputs['b'] !== 'undefined')
  	   b = inputs['b'];
      if (typeof inputs['a'] !== 'undefined')
  	   a = inputs['a'];
      
      if (a === null || b === null || condition === null)
  	   return;
      
      var res = condition(a, b); // call the function 'condition'
      if (res) {
  	   outputs['true'] = 1;
  	   outputs['false'] = 0;
  	   return;
      }
      outputs['true'] = 0;
      outputs['false'] = 1;
  };
  
  module.exports = IfElse;
```
At the first epoch the constructor will be called that can be used to specify a hidden state or memory of the node. At each iteration during an epoch the work function is called by the runner providing the current input and state values given the other connected nodes and their states. The computation in the work function of the node is expected to produce the outputs values as specified in the 'name' field of the node definition.
