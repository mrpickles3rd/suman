'use strict';

//dts
import {IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');
import fs = require('fs');
import assert = require('assert');

//npm
import * as chalk from 'chalk';
import su from 'suman-utils';

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const {constants} = require('../config/suman-constants');
const testErrors = _suman.testErrors = _suman.testErrors || [];
const errors = _suman.sumanRuntimeErrors = _suman.sumanRuntimeErrors || [];

////////////////////////////////////////////////////////////////////

_suman.isActualExitHandlerRegistered = true;

if (!process.prependListener) {
  process.prependListener = process.on.bind(process);
}

if (!process.prependOnceListener) {
  process.prependOnceListener = process.on.bind(process);
}

process.prependOnceListener('exit', function (code: number) {

  // _suman.logError('beginning of final exit call...');

  if (errors.length > 0) {
    code = code || constants.EXIT_CODES.UNEXPECTED_NON_FATAL_ERROR;
    errors.forEach(function (e: Error) {
      let eStr = su.getCleanErrorString(e);
      _suman.usingRunner && process.stderr.write(eStr);
      _suman.writeTestError && _suman.writeTestError(eStr);
    });
  }
  else if (testErrors.length > 0) {
    code = code || constants.EXIT_CODES.TEST_CASE_FAIL;
  }

  _suman.writeTestError('\n\n ### Suman end run ### \n\n\n\n', {suppress: true});

  if (code > 0 && testErrors.length < 1) {
    if (!_suman.usingRunner) { //TODO: need to fix this
      console.log(chalk.underline.bold.yellow(' Suman test process experienced a fatal error during the run, ' +
        'most likely the majority of tests, if not all tests, were not run.') + '\n');
    }
  }

  if (_suman.checkTestErrorLog) {
    console.log(chalk.yellow(' You have some additional errors/warnings - check the test debug log for more information.'));
    console.log(' => ' + chalk.underline.bold.yellow(_suman.sumanHelperDirRoot + '/logs/test-debug.log'));
    console.log('\n');
  }

  if (Number.isInteger(_suman.expectedExitCode)) {
    if (code !== _suman.expectedExitCode) {
      let msg = `Expected exit code not met. Expected => ${_suman.expectedExitCode}, actual => ${code}`;
      _suman.writeTestError(msg);
      _suman.logError(msg);
      code = constants.EXIT_CODES.EXPECTED_EXIT_CODE_NOT_MET;
    }
    else {
      console.log('\n');
      _suman.log(chalk.bgBlack.green(' Expected exit code was met. '));
      _suman.log(chalk.bgBlack.green(` Expected exit code was =>  '${code}'.`));
      _suman.log(chalk.bgBlack.green(' Because the expected exit code was met, we will exit with code 0. '));
      code = 0;
    }
  }

  if (!_suman.usingRunner) {

    let extra = '';
    if (code > 0) extra = ' => see http://sumanjs.org/exit-codes.html';

    console.log('\n');

    let start;
    if (start = process.env['SUMAN_START_TIME']) {
      _suman.log('Absolute total time => ', (Date.now() - start));
    }
    _suman.log('Suman test is exiting with code ' + code + ' ', extra);
    console.log('\n');
  }

  if (typeof _suman.absoluteLastHook === 'function') {
    _suman.logError('killing daemon process, using absolute last hook.');
    _suman.absoluteLastHook(code);
  }

  // => we probably don't need this...
  // _suman.logError('making final call to process.exit()');
  process.exitCode = code;
  // process.exit(code);

});

