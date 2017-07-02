'use strict';

//ts
import {IGlobalSumanObj, ISumanOpts} from "../dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import * as domain from 'domain';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as assert from 'assert';
import * as EE from 'events';
import * as cp from 'child_process';

//npm
import * as async from 'async';
const shuffle = require('lodash.shuffle');
const colors = require('colors/safe');
import su from 'suman-utils';
import {IGetFilePathObj} from "./runner-helpers/get-file-paths";
import {ISumanErrorFirstCB} from "./index";
const rimraf = require('rimraf');
const {events} = require('suman-events');
const debug = require('suman-debug')('s:cli');
const uuid = require('uuid/v4');
const mkdirp = require('mkdirp');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
const sumanHome = path.resolve(process.env.HOME + '/.suman');
const noFilesFoundError = require('./helpers/no-files-found-error');
const ascii = require('./helpers/ascii');
const {constants} = require('../config/suman-constants');
import {findSumanServer} from './find-suman-server';
const {findFilesToRun} = require('./runner-helpers/get-file-paths');
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());
const dbPth = path.resolve(process.env.HOME + '/.suman/database/exec_db');
const getIstanbulPath = require('./helpers/get-istanbul-exec-path.js');

//////////////////////////////////////////////////////////////////////////////////////////////////

export const run = function (sumanOpts: ISumanOpts, paths: Array<string>, sumanServerInstalled, sumanVersion) {

  const logsDir = _suman.sumanConfig.logsDir || _suman.sumanHelperDirRoot + '/logs';
  const sumanCPLogs = path.resolve(logsDir + '/runs');

  debugger;  //leave here forever so users can easily debug

  let sql;
  try {
    sql = require('sqlite3').verbose();
  }
  catch (err) {
    console.error('\n', err.stack, '\n');
    console.error(colors.yellow.bold(' => Looks like Suman could not find "sqlite3" NPM dependency.'));
    console.error(' => Suman uses NODE_PATH to source heavier dependencies from a shared location.');
    console.error(' => If you use the suman command, NODE_PATH will be set correctly.');

    if (process.env.NODE_PATH) {
      _suman.logError('$NODE_PATH currently has this value => ', process.env.NODE_PATH);
    }
    else {
      _suman.logError('$NODE_PATH is currently ' + colors.yellow('*not*') + ' defined.');
    }

    _suman.logError('If for whatever reason you ran node against the suman cli.js file, ' +
      'then NODE_PATH may not be set correctly.');
    _suman.logError('Try "$ NODE_PATH=$NODE_PATH:~/.suman/global/node_modules node <your-file.js>"');
    _suman.logError('You may attempt to use the --force flag to overcome this obstacle. But better to resolve the underlying issue.');
    if (!sumanOpts.force) {
      return process.exit(1);
    }
  }

  let runId: number = _suman.runId = process.env.SUMAN_RUN_ID = null;
  const projectRoot = _suman.projectRoot;
  const timestamp = _suman.timestamp = process.env.SUMAN_RUNNER_TIMESTAMP = Date.now();
  const server = _suman.server = findSumanServer(null);
  const testDir = process.env.TEST_DIR;
  const testSrcDir = process.env.TEST_SRC_DIR;
  const testTargerDir = process.env.TEST_TARGET_DIR;
  const makeSumanLog = process.env.MAKE_SUMAN_LOG = 'yes';
  const IS_SUMAN_SINGLE_PROCESS = process.env.SUMAN_SINGLE_PROCESS === 'yes';

  // this should get refactored into runner get-file-paths.js
  require('./helpers/vet-paths').run(paths);

  if (paths.length < 1) {
    if (testSrcDir) {
      paths = [testSrcDir];
    }
    else {
      throw new Error(' => Suman usage error => No "testSrcDir" prop specified in config or by command line.');
    }
  }

  //formerly async.parallel

  async.autoInject({

    removeCoverageDir: function (cb: ISumanErrorFirstCB) {

      if (sumanOpts.coverage) {
        const covDir = path.resolve(_suman.projectRoot + '/coverage');
        rimraf(covDir, function () {
          fs.mkdir(covDir, '511', cb);
        });
      }
      else {
        process.nextTick(cb);
      }

    },

    getIstanbulPath: function (cb: ISumanErrorFirstCB) {
      if (sumanOpts.coverage) {
        getIstanbulPath(function (err: Error, p: string) {
          if (err) return cb(err);
          _suman.istanbulExecPath = p;
          cb(null);
        });
      }
      else {
        process.nextTick(cb);
      }

    },

    mkdirs: function (cb: Function) {

      async.series([
        function (cb: Function) {
          mkdirp(path.resolve(sumanHome + '/global'), cb);
        },
        function (cb: Function) {
          mkdirp(path.resolve(sumanHome + '/database'), cb);
        }
      ], cb);

    },

    rimrafLogs: function (cb: Function) {

      fs.mkdir(sumanCPLogs, function (err) {

        if (err && !String(err).match(/EEXIST/i)) {
          return cb(err);
        }

        async.parallel({

          removeOld: function (cb) {

            fs.readdir(sumanCPLogs, function (err, items) {
              if (err) {
                return cb(err);
              }

              // we only keep the most recent 5 items, everything else we delete
              items.sort().reverse().splice(0, Math.min(items.length, 4));

              async.each(items, function (item, cb) {
                const pitem = path.resolve(sumanCPLogs + '/' + item);
                rimraf(pitem, cb); // ignore callback
              }, cb);

            });

          },

          createNew: function (cb) {
            // let p = path.resolve(sumanCPLogs + '/' + timestamp + '-' + runId);
            // fs.mkdir(p, 0o777, cb);
            return process.nextTick(cb);
          }

        }, cb);

      });

    },
    npmList: function (cb: ISumanErrorFirstCB) {

      return process.nextTick(cb);

      //TODO: this was causing problems, skip for now
      let callable = true;

      const to = setTimeout(first, 800);

      function first() {
        if (callable) {
          clearTimeout(to);
          callable = false;
          cb.apply(null, arguments);
        }
      }

      const n = cp.spawn('npm', ['view', 'suman', 'version'], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      n.on('close', first);

      n.stdout.setEncoding('utf8');
      n.stderr.setEncoding('utf8');

      n.stdout.on('data', function (data) {
        const remoteVersion = String(data).replace(/\s+/, '');
        const localVersion = String(sumanVersion).replace(/\s+/, '');
        if (callable && remoteVersion !== localVersion) {
          console.log(colors.red(' => Newest Suman version in the NPM registry:', remoteVersion, ', current version =>', localVersion));
        }
        else {
          console.log(colors.red(' => Good news, your Suman version is up to date with latest version on NPM'));
        }
      });

      n.stderr.on('data', function (data) {
        console.error(data);
      });

    },

    slack: function (cb: ISumanErrorFirstCB) {

      if (!process.env.SLACK_TOKEN) {
        return process.nextTick(cb);
      }

      let callable = true;
      const first = function () {
        if (callable) {
          clearTimeout(to);
          callable = false;
          cb.apply(null, arguments);
        }
      };

      const to = setTimeout(first, 200);

      let slack;
      try {
        slack = require('slack');
      }
      catch (err) {
        debug(err.stack);
        return process.nextTick(first);
      }

      slack.chat.postMessage({

        token: process.env.SLACK_TOKEN,
        channel: '#suman-all-commands',
        text: JSON.stringify({
          command: process.argv,
          config: _suman.sumanConfig
        })

      }, (err: Error) => {

        clearTimeout(to);
        if (err) {
          debug(err.stack || err);
        }
        first();
      });
    },

    checkIfTSCMultiWatchLock: function (cb: ISumanErrorFirstCB) {

      //fs.exists is deprecated
      fs.stat(path.resolve(projectRoot + '/suman-watch.lock'), function (err) {
        if (!err) {
          _suman.multiWatchReady = true;
        }
        // don't pass error
        cb(null);
      });
    },

    transpileFiles: function (cb: ISumanErrorFirstCB) {

      //TODO: transpile files should be after finding files
      if (sumanOpts.transpile && !sumanOpts.useBabelRegister) {
        su.runTranspile(paths, sumanOpts, cb);
      }
      else {
        process.nextTick(cb);
      }
    },

    getFilesToRun: function (cb: ISumanErrorFirstCB) {
      findFilesToRun(paths, function (err: Error, obj: IGetFilePathObj) {

        if (err) {
          return cb(err);
        }

        su.findSumanMarkers(['@run.sh', '@transform.sh'], testDir, obj.files, function (err: Error, map) {
          if (err) {
            cb(err);
          }
          else {
            _suman.markersMap = map;
            fs.writeFile(_suman.sumanHelperDirRoot + '/suman-map.json', JSON.stringify(map), function () {
              cb(err, obj);
            });
          }

        });
      });
    },

    conductStaticAnalysisOfFilesForSafety: function (cb: ISumanErrorFirstCB) {
      if (false && sumanOpts.safe) {
        cb(new Error('safe option not yet implemented'));
      }
      else {
        process.nextTick(cb);
      }
    },

    getRunId: function (cb: ISumanErrorFirstCB) {

      let callable = true;

      const first: ISumanErrorFirstCB = function () {
        if (callable) {
          callable = false;
          cb.apply(this, arguments);
        }
      };

      function createDir(runId: number) {
        let p = path.resolve(sumanCPLogs + '/' + timestamp + '-' + runId);
        fs.mkdir(p, 0o777, first);
      }

      if (!sql) {
        runId = _suman.runId = process.env.SUMAN_RUN_ID = uuid();
        return createDir(runId);
      }

      const db = new sql.Database(dbPth, function (err: Error) {
        if (err) {
          return first(err);
        }

        db.configure('busyTimeout', 4000);
        db.once('error', first);

        db.serialize(function () {
          db.run('BEGIN EXCLUSIVE TRANSACTION;');
          db.all('SELECT run_id from suman_run_id', function (err: Error, rows: Array<Object>) {
            if (err) {
              return first(err);
            }

            db.serialize(function () {

              if (rows.length > 1) {
                console.log(' => Suman internal warning => "suman_run_id" rows length is greater than 1.');
              }

              const val = rows[0] ? rows[0].run_id : 1;
              runId = _suman.runId = process.env.SUMAN_RUN_ID = val;
              const updatedValue = val + 1;
              db.run('UPDATE suman_run_id SET run_id = ' + updatedValue);
              db.run('COMMIT TRANSACTION;', function (err: Error) {
                db.close();
                err ? first(err) : createDir(runId);
              });
            });

          });
        });
      });
    }

  }, function complete(err: Error, results) {

    if (err) {
      _suman.logError('fatal problem => ' + (err.stack || err), '\n');
      return process.exit(1);
    }

    if (su.vgt(9)) {
      //TODO: this is not ready yet
      console.log('=> Suman verbose message => "$ npm list -g" results: ', results.npmList);
    }

    function changeCWDToRootOrTestDir(p: string) {
      if (sumanOpts.cwd_is_root) {
        process.chdir(projectRoot);
      }
      else {
        process.chdir(path.dirname(p));  //force CWD to test file path!
      }
    }

    const obj = results.getFilesToRun;

    let files = obj.files;
    const nonJSFile = !!obj.nonJSFile;

    if (files.length < 1) {
      return noFilesFoundError(paths);
    }

    const d = domain.create();

    d.once('error', function (err: Error) {
      _suman.logError(colors.magenta('fatal error => \n' + (err.stack || err) + '\n'));
      process.exit(constants.RUNNER_EXIT_CODES.UNEXPECTED_FATAL_ERROR);
    });

    resultBroadcaster.emit(String(events.RUNNER_TEST_PATHS_CONFIRMATION), files);

    if (su.vgt(2)) {
      console.log(' ', colors.bgCyan.magenta(' => Suman verbose message => ' +
        'Suman will execute test files from the following locations:'), '\n', files, '\n');
    }

    //TODO: if only one file is used with the runner, then there is no possible blocking,
    // so we can ignore the suman.order.js file,
    // and pretend it does not exist.

    if (IS_SUMAN_SINGLE_PROCESS && !sumanOpts.runner && !sumanOpts.coverage) {

      console.log(ascii.suman_slant, '\n');

      d.run(function () {
        changeCWDToRootOrTestDir(projectRoot);

        if (sumanOpts.rand) {
          files = shuffle(files);
        }
        _suman.sumanSingleProcessStartTime = Date.now();
        require('./run-child-not-runner').run(su.removeSharedRootPath(files));
      });
    }
    else if (!sumanOpts.runner && !sumanOpts.coverage && files.length === 1 && su.checkStatsIsFile(files[0]) && !nonJSFile) {

      console.log(ascii.suman_slant, '\n');
      d.run(function () {
        changeCWDToRootOrTestDir(files[0]);
        require('./run-child-not-runner').run(files);
      });
    }
    else {

      _suman.processIsRunner = true;
      const {createRunner} = require('./runner-helpers/create-suman-runner');
      d.run(function () {
        createRunner({runObj: obj});
      });
    }
  });
};
