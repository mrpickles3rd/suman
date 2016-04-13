/**
 * Created by denman on 3/26/2016.
 */


import * as suman from 'suman';  //es6 import syntax

const Test = suman.init(module, {
    interface: 'BDD'   //BDD interface is default but are explicit
});


function async(bool) {
    return function (target, key, descriptor) {
        descriptor.enumerable = value;
        return descriptor;
    }
}

@async(true);
function makeAsync(){

}



// here we create the test suite, we can pass in core modules, and any value defined in suman.ioc.js
Test.describe('#Test1', function (assert, fs, http, path) {


    this.describe('tests multiplication', function () {

        this.beforeEach(t => {   //this runs before any test case inside this describe block
            t.data.foo = 3;
        });


        this.it('[test] 1', async(t) => {  // t represents this test case, t.data properties can be set prior in hooks

            const bar = await new Promise(function (resolve) {
                resolve('7');
            });
            const baz = bar * t.data.foo;
            assert.equal(baz, 21);


        });

    });


    this.describe('tests streams', function () {

        this.beforeEach(t => {  //this runs before any test case inside this describe block
            t.data.srcDir = path.resolve(process.env.HOME + '/test_data');
        });

        //fail and pass are analagous to done('err') and done(null) respectively
        this.it('[test] 2', (t, fail, pass) => {

            fs.createReadStream(t.data.srcDir)
                .pipe(fs.createWriteStream('/dev/null')).on('error', fail).on('finish', pass);

        });

    });


    this.describe('tests http request', function () {

        ['/foo', '/bar', '/bar'].forEach(val => {

            this.it('[test] 3', (t, done) => {

                return http.get({
                    hostname: 'example.com',
                    path: val,
                    headers: {
                        'Accept': 'text/plain',
                        'Content-Type': 'application/json'
                    }
                }, res => {

                    res.setEncoding('utf8');

                    var body = '';

                    res.on('data', (data) => {
                        body += data;
                    });

                    res.on('end', ()=> {
                        const result = JSON.parse(body);
                        assert(result.x = 'y');
                        done();
                    });

                });

            });

        });

    });

});