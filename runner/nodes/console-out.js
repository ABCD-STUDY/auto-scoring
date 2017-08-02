//
// print values on the console 
//

var ConsoleOut = function (env) {
    this.environment = env;
};

ConsoleOut.prototype.work = function (inputs, outputs, state) {
    console.log(JSON.stringify(inputs));
};

module.exports = ConsoleOut;
