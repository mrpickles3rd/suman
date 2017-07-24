'use strict';
exports.__esModule = true;
//core
var path = require('path');
var util = require('util');
var assert = require('assert');
var _ = require('underscore');
//////////////////////////////////////////////////////////////////////
var scripts = path.resolve(__dirname + '/scripts');
//TODO: these functions should give users options to use kubernetes or docker
function getScript(s) {
    return path.resolve(scripts + '/' + s + '.sh');
}
function getBuildArgs(name) {
    return ' --build-arg s=' + 'scripts/' + name + '.sh' + ' --build-arg sname=' + name + '.sh ';
}
function build() {
    return 'cd ' + __dirname + ' &&  docker build ' + getBuildArgs(this.name) + ' -t ' + this.name + ' .';
}
function run() {
    return 'docker run -it --tty=false --rm ' + this.name;
}
function getPathToScript() {
    return path.resolve(scripts + '/' + this.name + '.sh');
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
var defaults = Object.freeze({
    allowReuseImage: false,
    useContainer: false,
    build: build,
    getPathToScript: getPathToScript,
    run: run
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
module.exports = function (data) {
    data = data || {};
    assert(typeof data === 'object', ' => Please pass in object to suman.groups.js function.');
    var groups = [
        {
            name: 'a'
        },
        {
            name: 'b'
        },
        {
            name: 'c'
        },
    ];
    return {
        //TODO: have to handle the case where the build has already been built - don't want to rebuild container
        // put in .suman/groups/scripts
        // if pathToScript is null/undefined, will read script with the same name as the group in the above dir
        groups: groups.map(function (item) {
            var def = _.defaults({}, data, item);
            var val = Object.assign({}, defaults, def);
            console.log('\n val => \n', util.inspect(val));
            return val;
        })
    };
};
