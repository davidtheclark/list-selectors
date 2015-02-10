'use strict';

var _ = require('lodash');
var fs = require('fs');
var globby = require('globby');
var postcss = require('postcss');
var selectorProcessors = require('./lib/selectorProcessors');

var TOP_LEVEL_INCLUDES = [
  'selectors',
  'simpleSelectors',
  'simple'
];

var SIMPLE_INCLUDES = [
  'classes',
  'ids',
  'attributes',
  'types'
];

function listSelectors(/* args */) {
  var args = _.toArray(arguments);
  var firstArg = _.first(args);
  var fileGlob = (!_.isPlainObject(firstArg) && !_.isFunction(firstArg)) ? firstArg : false;
  var polyIndex = (fileGlob) ? 1 : 0;
  var mysteryArg = arguments[polyIndex];
  var opts = (_.isPlainObject(mysteryArg)) ? mysteryArg : {};
  var cb = (_.isFunction(mysteryArg)) ? mysteryArg : arguments[polyIndex + 1] || _.noop;


  // Standalone function is indicated by the initial file glob
  if (fileGlob) {
    listSelectorsStandalone(fileGlob, opts, cb);
    return;
  }

  return _.partial(listSelectorsPostcss, opts, cb);
}

function listSelectorsPostcss(opts, cb, cssTree) {
  var result = {};

  var accumulatedSelectors = [];
  cssTree.eachRule(function(rule) {
    rule.selectors.forEach(function(selector) {
      accumulatedSelectors.push(selector);
    });
  });

  result.selectors = _.sortBy(_.uniq(accumulatedSelectors), selectorSortFn);

  result.simpleSelectors = {};
  result.simpleSelectors.all = _.sortBy(
    _.uniq(selectorProcessors.reduceToSimpleSelectors(result.selectors)),
    selectorSortFn
  );

  result.simpleSelectors.ids = selectorProcessors.getIds(result.simpleSelectors.all);
  result.simpleSelectors.classes = selectorProcessors.getClasses(result.simpleSelectors.all);
  result.simpleSelectors.attributes = selectorProcessors.getAttributes(result.simpleSelectors.all);
  result.simpleSelectors.types = selectorProcessors.getTypes(result.simpleSelectors.all);

  result = processIncludes(result, opts.include);

  cb(result);

  return cssTree;
}

function listSelectorsStandalone(fileGlob, opts, cb) {
  var fullCss = '';

  globby(fileGlob, function(err, filePaths) {
    if (err) { throw err; }
    filePaths.forEach(function(filePath) {
      fullCss += fs.readFileSync(filePath, { encoding: 'utf8' });
    });
    postcss(listSelectors(opts, cb)).process(fullCss);
  });
}

function selectorSortFn(selector) {
  var lowerNoPseudo = selector.split(':')[0].toLowerCase();
  return (selector.match(/^[#\.\[]/)) ? lowerNoPseudo.substr(1) : lowerNoPseudo;
}

function processIncludes(selectorList, includes) {
  if (!includes) { return selectorList; }
  if (_.isString(includes)) { includes = [includes]; }

  var result = _.reduce(includes, function(r, include) {
    if (_.contains(TOP_LEVEL_INCLUDES, include)) {
      if (_.contains(['simple', 'simpleSelectors'], include)) {
        r.simpleSelectors = selectorList.simpleSelectors.all;
      } else {
        r[include] = selectorList[include];
      }
      return r;
    }

    if (_.contains(SIMPLE_INCLUDES, include)) {
      r[include] = selectorList.simpleSelectors[include];
      return r;
    }

    throw new Error(
      'Invalid include "' + include + '" passed. The possibilities are: ' +
      TOP_LEVEL_INCLUDES.concat(SIMPLE_INCLUDES).join(', ')
    );
  }, {});
  return result;
}

module.exports = listSelectors;
