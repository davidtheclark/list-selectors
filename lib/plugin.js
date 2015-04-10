'use strict';

var postcss = require('postcss');
var _ = require('lodash');
var selectorSort = require('./selectorSort');
var selectorProcessors = require('./selectorProcessors');
var processIncludes = require('./processIncludes');

/**
 * The postcss plugin at the heart of everything.
 *
 * @param {object|function} [options] - If this is a function it's interpreted as the callback
 * @param {function} [callback] - Callback, which will receive the list of selectors as its argument
 */
module.exports = postcss.plugin('list-selectors', function(options, callback) {
  var opts, cb;
  if (_.isFunction(options)) {
    opts = {};
    cb = options;
  } else {
    opts = options || {};
    cb = callback || _.noop;
  }

  return function(cssTree, postcssResult) {
    var selectorObj = {};

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
      postcssResult.warn(
        'Failed to find any selectors at all in the source files you provided. ' +
        'You are going to get an empty selector list.'
      );
      cb({});
      return;
    }

    // Add sorted, unique selectors to results
    selectorObj.selectors = _.sortBy(_.uniq(accumulatedSelectors), selectorSort);

    // Add sorted, unique simple selectors to results
    selectorObj.simpleSelectors = {};
    selectorObj.simpleSelectors.all = _.sortBy(
      _.uniq(selectorProcessors.reduceToSimpleSelectors(selectorObj.selectors)),
      selectorSort
    );

    // Add all of the category lists (of simple selectors) to results
    selectorObj.simpleSelectors.ids = selectorProcessors.getIds(selectorObj.simpleSelectors.all);
    selectorObj.simpleSelectors.classes = selectorProcessors.getClasses(selectorObj.simpleSelectors.all);
    selectorObj.simpleSelectors.attributes = selectorProcessors.getAttributes(selectorObj.simpleSelectors.all);
    selectorObj.simpleSelectors.types = selectorProcessors.getTypes(selectorObj.simpleSelectors.all);

    // Refine the results according to any `include` options passed
    selectorObj = processIncludes(selectorObj, opts.include, postcssResult);

    // Call the callback as promised, passing the selectorObj as an argument
    cb(selectorObj);
  };
});
