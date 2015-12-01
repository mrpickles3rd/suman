/**
 * Created by amills001c on 11/24/15.
 */


/* advantages of Suman
 *
 * better than mocha, cleaner than vows
 * no globals - no global NPM module - no global variables
 * test suites each run in separate process for speed and correctness
 * each test suite can have parallel components, allowing the developer to run tests serially, in parallel or in combination, as the developer sees fit
 * code inside any test will not run for any test not intended to run when using grep features
 * organize your tests depending on NODE_ENV or command line flags using config files, instead of putting tests in different top-level folders in your project
 *
 * */


var appRootPath = require('app-root-path');
var fs = require('fs');
var path = require('path');


function makeSuman($module, configPath) {


    var config = require(path.resolve(appRootPath + '/' + configPath));
    var outputDir = config.outputDir;
    var outputPath = path.resolve(appRootPath + '/' + outputDir + '/' + path.basename($module.filename, '.js') + '.txt')

    var wstream = fs.createWriteStream(outputPath);


    var log = function (data, test) {
        var json = JSON.stringify({
            userOutput: true,
            testId: test.testId,
            children: test.children,
            testsParallel: test.testsParallel,
            desc: test.desc,
            data: data
        });
        //wstream.write(json += ',');

        //fs.writeFileSync(outputPath, json += ',', {flags: 'a'});
        fs.appendFileSync(outputPath, json += ',');
    };

    var logErrors = function (test) {

        //var json = JSON.stringify({
        //    testId: test.testId,
        //    desc: test.desc,
        //    type:test.type,
        //    tests: test.tests,
        //    testsParallel: test.testsParallel,
        //    loopTests: test.loopTests,
        //    children: test.children,
        //    error: test.error
        //});

        test.error = test.error || null;

        var json = JSON.stringify(test);
        //wstream.write(json += ',');
        //fs.writeFileSync(outputPath, json += ',', {flags: 'a'});
        fs.appendFileSync(outputPath, json += ',');
    };


    return {

        suite: require('./lib/ntf').main(log, logErrors)

    }


}

makeSuman.Runner = require('./lib/runner');

module.exports = makeSuman;