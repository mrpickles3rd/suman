'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var _suman = global.__suman = (global.__suman || {});
var constants = require('../../config/suman-constants').constants;
var socketio_child_client_1 = require("./socketio-child-client");
exports.handleRequestResponseWithRunner = function (data) {
    var accumulatedData = {
        ROOT_SUITE_NAME: '',
        SUITE_COUNT: 0,
        SUITE_SKIPPED_COUNT: 0,
        TEST_CASES_TOTAL: 0,
        TEST_CASES_FAILED: 0,
        TEST_CASES_PASSED: 0,
        TEST_CASES_SKIPPED: 0,
        TEST_CASES_STUBBED: 0,
        TEST_FILE_MILLIS: Date.now() - _suman.sumanInitStartDate,
        OVERALL_DESIGNATOR: 'received'
    };
    data.forEach(function (d) {
        accumulatedData.SUITE_COUNT += d.SUITE_COUNT;
        accumulatedData.SUITE_SKIPPED_COUNT += d.SUITE_SKIPPED_COUNT;
        accumulatedData.TEST_CASES_TOTAL += d.TEST_CASES_TOTAL;
        accumulatedData.TEST_CASES_FAILED += d.TEST_CASES_FAILED;
        accumulatedData.TEST_CASES_PASSED += d.TEST_CASES_PASSED;
        accumulatedData.TEST_CASES_SKIPPED += d.TEST_CASES_SKIPPED;
        accumulatedData.TEST_CASES_STUBBED += d.TEST_CASES_STUBBED;
    });
    return function (cb) {
        var client = socketio_child_client_1.getClient();
        var TABLE_DATA = constants.runner_message_type.TABLE_DATA;
        client.on(TABLE_DATA, function onTableDataReceived(data) {
            if (data.info = 'table-data-received') {
                process.removeListener('message', onTableDataReceived);
                cb(null);
            }
        });
        client.emit(TABLE_DATA, {
            type: constants.runner_message_type.TABLE_DATA,
            data: accumulatedData,
            childId: process.env.SUMAN_CHILD_ID
        });
    };
};