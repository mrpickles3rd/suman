'use strict';
import {IGlobalSumanObj} from "suman-types/dts/global";

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import path = require('path');

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});
import {getProjectModule, lastDitchRequire, getCoreAndDeps} from './helpers';

/////////////////////////////////////////////////////////////////

export const makeIocStaticInjector = function () {

  return function (names: Array<string>): Array<any> {

    return names.map(function (n) {

      if (n === '$core') {
        return getCoreAndDeps().$core;
      }

      if (n === '$deps') {
        return getCoreAndDeps().$deps;
      }

      if (n === '$args') {
        return String(_suman.sumanOpts.user_arg || [])
      }

      if (n === '$root' || n === '$projectRoot') {
        return _suman.projectRoot;
      }

      if (n === '$index' || n === '$project') {
        return getProjectModule();
      }

      return lastDitchRequire(n, '<suman.ioc.static.js>');

    });

  }

};
