'use strict';

var _ = require('lodash');
var fs = require('fs');
var globby = require('globby');
var request = require('request');
var postcss = require('postcss');
var chalk = require('chalk');
var selectorProcessors = require('./lib/selectorProcessors');

var logPrefix = chalk.bold('list-selectors: ');

// These are the valid `include` option values.
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


/**
 * The function that people will run.
 *
 * Arguments are polymorphic, and the process will change based on the type of input.
 *
 * @param {string|string[]} [source] - If the first argument is a string or array (of strings),
 *   you are passing a glob (or globs) or a URL -- in which case, you are not using it as a
 *   postcss plugin, but as a standalone function via node or the CLI. If this argument is
 *   absent, we have to assume you're using the function a as a postcss plugin.
 * @param {object} [options]
 * @param {function} [cb] - A callback that will receive the result list of selectors
 *   as an argument.
 * @return {undefined|function} If used as a postcss plugin, listSelectors will return a
 *   function that fits into your postcss piping. Otherwise, it doesn't return anything:
 *   its results are available for use in the callback.
 */
function listSelectors(/* [source, options, cb] */) {
  var firstArg = arguments[0];
  var source = (!_.isPlainObject(firstArg) && !_.isFunction(firstArg)) ? firstArg : false;
  var polyIndex = (source) ? 1 : 0;
  var mysteryArg = arguments[polyIndex]; // Could be options or callback
  var opts = (_.isPlainObject(mysteryArg)) ? mysteryArg : {};
  var cb = (_.isFunction(mysteryArg)) ? mysteryArg : arguments[polyIndex + 1] || _.noop;

  // Standalone function is indicated by the initial file glob
  if (source) {
    listSelectorsStandalone(source, opts, cb);
  } else {
    return _.partial(listSelectorsPostcss, opts, cb);
  }
}


/**
 * The postcss plugin at the heart of everything.
 *
 * @param {object} opts
 * @param {function} cb
 * @param {object} cssTree - CSS Node Tree from PostCSS processing
 * @return {object} The same cssTree we got in, for other PostCSS plugins
 *   that follow to use
 */
function listSelectorsPostcss(opts, cb, cssTree) {
  var result = {};

  // Run through all the rules and accumulate a list of selectors
  // parsed out by PostCSS
  var accumulatedSelectors = [];
  cssTree.eachRule(function(rule) {
    // Ignore keyframes, which can log e.g. 10%, 20% as selectors
    if (rule.parent.type === 'atrule' && /keyframes/.test(rule.parent.name)) { return; }

    rule.selectors.forEach(function(selector) {
      accumulatedSelectors.push(selector);
    });
  });

  // If no selectors were found, results are an empty object
  if (_.isEmpty(accumulatedSelectors)) {
    console.log(logPrefix + chalk.red(
      'Failed to find any selectors at all in the source files you provided. ' +
      'You are going to get an empty selector list.'
    ));
    cb({});
    return cssTree;
  }

  // Add sorted, unique selectors to results
  result.selectors = _.sortBy(_.uniq(accumulatedSelectors), selectorSortFn);

  // Add sorted, unique simple selectors to results
  result.simpleSelectors = {};
  result.simpleSelectors.all = _.sortBy(
    _.uniq(selectorProcessors.reduceToSimpleSelectors(result.selectors)),
    selectorSortFn
  );

  // Add all of the category lists (of simple selectors) to results
  result.simpleSelectors.ids = selectorProcessors.getIds(result.simpleSelectors.all);
  result.simpleSelectors.classes = selectorProcessors.getClasses(result.simpleSelectors.all);
  result.simpleSelectors.attributes = selectorProcessors.getAttributes(result.simpleSelectors.all);
  result.simpleSelectors.types = selectorProcessors.getTypes(result.simpleSelectors.all);

  // Refine the results according to any `include` options passed
  result = processIncludes(result, opts.include);

  // Call the callback as promised, passing the result as an argument
  cb(result);

  return cssTree;
}


/**
 * When using this as a standalone function or via CLI, we'll need
 * to get the source files before processing. They might be local,
 * identified with globs, or remote, identified with a URL.
 * Get the source files, accumulate them into a string, then
 * run that string through postcss with listSelectors as a plugin.
 *
 * Parameters are the same as for listSelectors, above
 * (and listSelectors will pass them).
 */
function listSelectorsStandalone(source, opts, cb) {
  var fullCss = '';

  if (_.startsWith(source, 'http')) {
    processRemoteCss();
  } else {
    processLocalCss();
  }

  function processRemoteCss() {
    var url = (_.isArray(source)) ? source[0] : source;
    request(url, function(err, resp, body) {
      if (err) { throw chalk.red(err); }
      if (resp.statusCode !== 200) {
        console.log(
          logPrefix + chalk.red('Failed to fetch ') + chalk.yellow.underline(url) +
          chalk.red('. Maybe you flubbed the url?')
        );
        body = '';
      }
      postcss(listSelectors(opts, cb)).process(body);
    });
  }

  function processLocalCss() {
    globby(source, function(err, filePaths) {
      if (err) { throw chalk.red(err); }
      if (!filePaths.length) {
        console.log(
          logPrefix + chalk.red('Failed to find any files matching your glob ') +
          chalk.yellow.underline(source)
        );
      }

      filePaths.forEach(function(filePath) {
        fullCss += fs.readFileSync(filePath, { encoding: 'utf8' });
      });
      postcss(listSelectors(opts, cb)).process(fullCss);
    });
  }
}


/**
 * Used to sort selectors alphabetically, ignoring initial category
 * distinguishing punctuation like `#`, `.`, and `[`.
 *
 * @param {string} selector
 * @return {string} The sortable selector:
 *   lowercased, stripped of initial punctuation
 */
function selectorSortFn(selector) {
  var lowerNoPseudo = selector.split(':')[0].toLowerCase();
  return (/^[#\.\[]/.test(selector)) ? lowerNoPseudo.substr(1) : lowerNoPseudo;
}


/**
 * Filter a full selector list according to specific `include` options.
 *
 * @param {object} selectorList
 * @param {string|object} includes
 * @return {object} The filtered selectorList
 */
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

    console.log(logPrefix + chalk.red('Invalid include "' + include + '" passed. ' +
      'The possibilities are: ' +
      TOP_LEVEL_INCLUDES.concat(SIMPLE_INCLUDES).join(', ') + '. ' +
      'You\'ll get the full selector list now.'
    ));
    return selectorList;
  }, {});
  return result;
}

module.exports = listSelectors;
