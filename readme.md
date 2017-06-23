## Auto-scoring

This project comes in two parts - a viewer for viewing and editing algorithms and a runner for running algorithms.

![List of recipes](https://github.com/ABCD-STUDY/auto-scoring/raw/master/images/auto-scoring.png)

### Viewer

The viewer is used to create a data flow graph using visual programming. Generally data flows from left to right through "connections" between "nodes". Each node has a list of incoming ports and outgoing ports (and a list of internal state variables). As an example the node calculating the mean of its inputs has 10 input ports that may or may not be connected to something. The three output ports represent the mean of the connected inputs, the number of missing connected values and the total number of connected values respectively.

![The viewer used to edit recipes](https://github.com/ABCD-STUDY/auto-scoring/raw/master/images/viewer.png)

Drag- and drop a node from the list on the left to the canvas to instantiate a node. Drag- and drop using the gray port circles on each node to create a connection. Select a node to get a list of the internal state variables on the left.

The interface of a node is defined in the items.json file. The structure contain the name and the three lists inputs, outputs and state that define the interface of the node. Inputs and outputs are translated into ports that have a name and a connection circle. The state list is displayed on the left hand side if a node is selected. Usually state variables are used to provide default values for an input or output port. In the case of the redcap_get.js node the state variable identify the names of REDCap variables that should be used for processing. In the case of the If-Else.js node the state variables can be used to represent default values for the 'a' or 'b' inputs. State variables in the If-Else node are overwritten by data arriving at the node over connections from other nodes. 

Nodes have two special visual elements at the top. The orange circle on the left is an enabler connection. Anything connecting to this special port will disable the node if its evaluated to 'false' or '0'. The orange cross on the top right of each node can be used to remove a node.

There is currently no way to remove a connection between two ports. As a work-around remove the node on one end and add it again.

Save and load graphs - or "recipes" from the select2 control on the top left of the page. Only Chrome is currently enabled to create a screenshot of the recipe if you save. Both the recipe and its picture are stored in the recipes/ folder of the viewer.

### Runner

The runner is a nodejs program that will run a recipe. Whereas the viewer is a very generic component that might be easily adjusted to different use cases the runner is specialized.

In the context of this project sets of input values represent raw scores for participants that need to be processed and produce sets of output values that represent derived scores. The derived scores are added back to the database. The processing of a single set of input values is handeled in an 'epoch'. During the epoch all nodes of the graph are evaluated randomly until no change in any single nodes inputs, outputs or internal state variables is observed. This ends the epoch and in the next epoch another set of input variables is selected for processing. Epochs end if no more sets are available for processing.

If node represents input our outputs to the graph it defines a epoch() function. Other processing nodes will not implement epoch() but solely depend on their input ports for processing. For example the redcap_get.js node will pull a list of participant scores from REDCap. Each single participants data is processed in one epoch. During that epoch the outputs of the redcap_get.js node are the values for the current participant.

Epoch information is also used by the output node redcap_put.js. This node caches the calculated values from the end of the epoch to prevent particially calculated values during the non-deterministic execution of the graph.
