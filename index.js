'use strict';

var _ = require('lodash');
var fs = require('fs');
var globby = require('globby');
var postcss = require('postcss');
var selectorProcessors = require('./lib/selectorProcessors');

function listSelectors(/* args */) {
  var firstArg = arguments[0];

  if (_.isFunction(firstArg)) {
    return _.partial(listSelectorsPostcss, firstArg);
  }

  listSelectorsStandalone.apply(null, arguments);

}

function listSelectorsPostcss(cb, cssTree) {
  cb = cb || _.noop;

  var result = {};

  result.all = [];
  cssTree.eachRule(function(rule) {
    rule.selectors.forEach(function(selector) {
      result.all.push(selector);
    });
  });

  result.simpleSelectors = {};
  result.simpleSelectors.all = _.sortBy(
    _.uniq(selectorProcessors.reduceToSimpleSelectors(result.all)),
    function(selector) {
      var lowerSelector = selector.toLowerCase();
      return (selector.match(/^[#\.\[]/)) ? lowerSelector.substr(1) : lowerSelector;
    }
  );

  result.simpleSelectors.ids = selectorProcessors.getIds(result.simpleSelectors.all);
  result.simpleSelectors.classes = selectorProcessors.getClasses(result.simpleSelectors.all);
  result.simpleSelectors.attributes = selectorProcessors.getAttributes(result.simpleSelectors.all);
  result.simpleSelectors.types = selectorProcessors.getTypes(result.simpleSelectors.all);

  cb(result);

  return cssTree;
}

function listSelectorsStandalone(fileGlob, cb) {
  cb = cb || _.noop;

  var fullCss = '';

  globby(fileGlob, function(err, filePaths) {
    if (err) { throw err; }
    filePaths.forEach(function(filePath) {
      fullCss += fs.readFileSync(filePath, { encoding: 'utf8' });
    });
    postcss(listSelectors(cb)).process(fullCss);
  });
}

module.exports = listSelectors;
