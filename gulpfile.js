/**
 * Created by denman on 12/9/15.
 */

//core
const gulp = require('gulp');
const path = require('path');
const fs = require('fs');
const async = require('async');
const _ = require('underscore');
const chalk = require('chalk');
const request = require('request');
const ijson = require('idempotent-json');
const suman = require('./lib');
const sumanConstants = suman.constants;

//gulp plugins
const babel = require('gulp-babel');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const rename = require('gulp-rename');
const nodemon = require('gulp-nodemon');

//args & env
const argv = process.env.argv;
const $node_env = process.env.NODE_ENV;

//you should be able to run your tests with gulp, instead of npm run blah


gulp.task('clean-temp', function () {
    return del(['dest']);
});

gulp.task('transpile', [/*'clean-temp'*/], function () {
    return gulp.src(['test/**/*.js'])
        .pipe(babel({
            presets: ['es2016']
        }))
        .pipe(gulp.dest('test-dest'));
});


gulp.task('nodemon', [], function () {

    nodemon({

        script: 'bin/www',
        ext: 'js',
        ignore: ['public/*', '*.git/*', '*.idea/*', 'routes/*', 'gulpfile.js'],
        args: [], //TODO: add these from command line
        nodeArgs: ['--harmony_destructuring'],
        env: {
            NODE_ENV: $node_env
        }

    }).on('restart', []);

});


gulp.task('watch_tests', ['suman'], function (cb) {

    //testRunner('./test/build-tests','suman.conf.js');

    suman.Runner({
        $node_env: process.env.NODE_ENV,
        fileOrDir: './test/build-tests',
        configPath: './suman.conf.js'
    }).on('message', function (msg) {
        if (msg === 0) {
            console.log('msg from suman runner', msg);
        }
        else {
            msg = new Error(msg);
            console.error(msg);
        }

        cb(null);
    });

});

gulp.task('run_tests0', [], function (cb) {
    suman.Runner({
        $node_env: process.env.NODE_ENV,
        fileOrDir: ['./test/integration-tests'],
        configPath: 'suman.conf.js'
    }).on('message', function (msg) {
        console.log('msg from suman runner', msg);
        process.exit(msg);
    });
});

gulp.task('run_tests', ['suman'], function (cb) {

    suman.Runner({
        $node_env: process.env.NODE_ENV,
        fileOrDir: ['test/build-tests', 'test/integration-tests'],
        configPath: 'suman.conf.js',
        runOutputInNewTerminalWindow: false
    }).on('message', function (msg) {
        console.log('message:', msg);
    }).on('data', function (data) {
        console.log('data:', data);
    }).on('error', function (err) {
        cb(err);
    }).on('exit', function (code) {
        cb(null);
    });

});

gulp.task('run_all_tests', ['suman_server'], function (cb) {

    suman.Runner({
        $node_env: process.env.NODE_ENV,
        fileOrDir: ['test/build-tests'],
        configPath: 'suman.conf.js',
        runOutputInNewTerminalWindow: false
    }).on('message', function (msg) {
        console.log('message:', msg);
    }).on('data', function (data) {
        console.log('data:', data);
    }).on('error', function (err) {
        cb(err);
    }).on('exit', function (code) {
        cb(null);
    });

});


gulp.task('suman_server', [], function (cb) {

    suman.Server({
        configPath: './suman.conf.js'
    }).on('msg', function (msg) {
        console.log('msg', msg);
        cb();
    }).on('msg-2', function (msg) {
        console.log('msg-2', msg);
    });

});





