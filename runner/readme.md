## Runner

```
  ./runner.js run -i ../viewer/recipes/FirstTest.json
```

The runner will execute the graph in stages. Each stage or epoch processes one set of input data, in this case a participant ID, a visit or event name and a set of raw scores (numbers or strings). During the epoch the input values to the graph will be fixed and all nodes in the graph will be called in a random order until no change in the graph is detected. This finishes the current epoch and the next epoch is started with a new set of input data. The runner finishes of there is no more data to process.

### Implementing a new node

The runner signals different processing requests to the nodes by calling named functions in each node's code. The different functions names create the node API supported by this runner. Here an example for the simplest of all nodes that implements logical not:
```
var Not = function () {
    this._condition = function(a) { return !(a); };
};

Not.prototype.work = function (inputs, outputs, state) {
    outputs['out'] = this._condition;
};

module.exports = Not;
```
The node module needs to be imported in runner.js and must be part of the runner's work function switch statement. Together with this node implementation in the runner directory the viewer also needs to define the corresponding user interface in its items.json file:
```json
{
  "name": "not",
  "id": "not",
  "group": "Logic",
  "description": "Logic Expression - Not",
  "inputs": [
      { "name": "in", "type": "all" }
  ],
  "outputs": [
      { "name": "out", "type": "all" }
  ]
},
```

### Node API

Nodes can implement the following functions to react to signals from the runner.

#### Constructor
```
 [Named function]
```
Called once if the graph is created. Use this place to perform initialization of your modules. The REDCap_get module for example uses this location to start all the data pull operations. Here the much simplier example of the not-node that just creates a comparison functionn as an internal variable:
```javascript
var Not = function () {
    this._condition = function(a) { return !(a); };
};
```

### Destructor
```
 [cleanUp() added to prototype]
```
Called if the runner decides that no more work can be done. Use this function if your node needs to clean-up after itself. The REDCap_put node for example uses this call to send the last remaining scores back to the database.
```javascript
RedcapPut.prototype.cleanUp = function () {
    sendToREDCap( { scores: this._results } );
    console.log("Results after sending (" +
    	        this._results.length +
		"): \n" +
		JSON.stringify(this._results, null, '  '));
}
```