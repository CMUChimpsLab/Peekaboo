const fs = require('fs') 
const deepClone = require('lodash.clonedeep');

const nodeStatusError = function (node, statusText) {
    node.status({ fill: "red", shape: "ring", text: statusText });
};

const nodeStatusProcessing = function (node, statusText) {
    node.status({ fill: "yellow", shape: "ring", text: statusText });
};

const nodeStatusSuccess = function (node, statusText) {
    node.status({ fill: "green", shape: "ring", text: statusText });
};

const appendToAFile = function(filename, content) {
    fs.appendFile(filename, content, (err) => { 
        if (err) throw err; 
    }) 
}

// // deep clone.
// const deepClone = function (oldobject) {
//     return clonedeep(oldobject);
//     return (true, {}, oldObject);
// }

module.exports = {
    nodeStatusError, 
    nodeStatusProcessing, 
    nodeStatusSuccess, 
    deepClone,
    appendToAFile
  }