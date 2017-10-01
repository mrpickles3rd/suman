'use strict';

//dts
import {ISuman, Suman} from "../suman";
import {ITestSuite} from "suman-types/dts/test-suite";

//npm
const pragmatik = require('pragmatik');

///////////////////////////////////////////////////////////////////////////////////////////

export const makeProxy = function (suman: ISuman, ctx: ITestSuite) : Function {

  return function getProxy(method: Function, rule: Object, props?: Array<string>): Function {

    /*
    NOTE
     this function allows us to dynamically generate functions such as
     => after.last.always.skip();
     this way we only create the functions we need, instead of enumerating them all here.
     this makes for a leaner and more maintenable codebase as well as potentially higher performance.
    */

    return new Proxy(method, {
      get: function (target, prop) {

        props = props || [];
        let hasSkip = false;
        let newProps = props.concat(String(prop)).filter(function (v, i, a) {
          if (String(v).toLowerCase() === 'skip') {
            // if skip, none of the other properties matter
            hasSkip = true;
          }
          // we use this filter to get a unique list
          return a.indexOf(v) === i;
        })
        // sort the properties alphabetically so that we need to use fewer number of caches
        .sort()
        .map(v => String(v).toLowerCase());

        if (hasSkip) {
          // if any of the props are "skip" then we can reduce it to just "skip"
          newProps = ['skip'];
        }

        let cache, cacheId = newProps.join('-');

        let fnCache = ctx.testBlockMethodCache.get(method);
        if (!fnCache) {
          fnCache = {};
          ctx.testBlockMethodCache.set(method, fnCache);
        }

        if (cache = ctx.testBlockMethodCache.get(method)[cacheId]) {
          return cache;
        }

        let fn = function () {

          let args = pragmatik.parse(arguments, rule);

          newProps.forEach(function (p) {
            args[1][p] = true;
          });

          args[1].__preParsed = true;
          return method.apply(ctx, args);
        };

        return fnCache[cacheId] = getProxy(fn, rule, newProps);

      }
    });
  };

};
