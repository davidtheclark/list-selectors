'use strict';

var postcss = require('postcss');
var selectorParser = require('postcss-selector-parser');
var _ = require('lodash');
var selectorSort = require('./selectorSort');
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

  return function(cssRoot, postcssResult) {
    var selectorObj = {};

    // Run through all the rules and accumulate a list of selectors
    // parsed out by PostCSS
    var accumulatedSelectors = [];
    cssRoot.walkRules(function(rule) {
      // Ignore keyframes, which can log e.g. 10%, 20% as selectors
      if (rule.parent.type === 'atrule' && /keyframes/.test(rule.parent.name)) return;

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
    var sortedUniqueSelectors = _.chain(accumulatedSelectors)
      .uniq()
      .sortBy(selectorSort)
      .value();

    selectorObj.selectors = sortedUniqueSelectors;

    selectorObj.simpleSelectors = {
      all: [],
      ids: [],
      classes: [],
      attributes: [],
      types: []
    };

    // Add sorted, unique *simple* selectors to results
    sortedUniqueSelectors.forEach(function(selector) {
      selectorParser(function(selectors) {
        selectors.eachInside(function(node) {
          // Various nodes the selector-parser loops through should be ignored
          if (_.includes(['selector', 'comment', 'combinator', 'pseudo'], node.type)) return;
          // Arguments of `:nth-*` pseudo-classes should be ignored, as they
          // are integers, an+b expressions, or "odd" and "even"
          if (node.parent.parent.value && node.parent.parent.value.substr(0, 5) === ':nth-') return;
          selectorObj.simpleSelectors.all.push(node.toString());
          switch (node.type) {
            case 'id':
              selectorObj.simpleSelectors.ids.push(node.toString());
              break;
            case 'class':
              selectorObj.simpleSelectors.classes.push(node.toString());
              break;
            case 'attribute':
              selectorObj.simpleSelectors.attributes.push(node.toString());
              break;
            case 'tag':
              selectorObj.simpleSelectors.types.push(node.toString());
              break;
            default:
          }
        });
      }).process(selector);
    });

    _.forOwn(selectorObj.simpleSelectors, function(selectorList, key) {
      selectorObj.simpleSelectors[key] = _.chain(selectorList)
        .flatten()
        .uniq()
        .sortBy(selectorSort)
        .value();
    });

    // // Refine the results according to any `include` options passed
    selectorObj = processIncludes(selectorObj, opts.include, postcssResult);

    // Call the callback as promised, passing the selectorObj as an argument
    cb(selectorObj);
  };
});
