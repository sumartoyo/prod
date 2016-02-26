var fs = require('fs');
var Promise = require('bluebird');

var save = function(path, text) {
    return new Promise(function(resolve, reject) {
        fs.writeFile(path, text, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

module.exports = {save: save};
