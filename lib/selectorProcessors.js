'use strict';

var _ = require('lodash');

function extractSimpleSelectors(selector) {
  // http://www.w3.org/TR/css3-selectors/#selector-syntax
  var COMBINATORS = '\\s>+~';
  var NEW_BEGINNINGS = '\\.#\\[\\(\\)';
  var UNIVERSAL_SELECTOR = '\\*';
  var safeChars = '[^' + COMBINATORS + NEW_BEGINNINGS + ']+';
  var typeSelector = safeChars;
  var attributeSelector = '\\[.+?\\](?::' + safeChars + ')?';
  var idSelector = '#' + safeChars;
  var classSelector = '\\.' + safeChars;
  var simpleSelectors = new RegExp([
    UNIVERSAL_SELECTOR,
    typeSelector,
    attributeSelector,
    idSelector,
    classSelector
  ].join('|'), 'g');
  return selector.match(simpleSelectors);
}

function stripPseudosFromSimpleSelector(simpleSelector) {
  // http://www.w3.org/TR/css3-selectors/#pseudo-classes
  // http://www.w3.org/TR/css3-selectors/#pseudo-elements
  return _.first(_.compact(simpleSelector.split(/:/)));
}

function reduceToSimpleSelectors(selectorArray) {
  var simpleSelectors = _.compact(_.flatten(_.map(selectorArray, extractSimpleSelectors)));
  return _.map(simpleSelectors, stripPseudosFromSimpleSelector);
}

function getIds(selectorArray) {
  return filterForStart(/\#/, selectorArray);
}

function getClasses(selectorArray) {
  return filterForStart(/\./, selectorArray);
}

function getAttributes(selectorArray) {
  return filterForStart(/\[/, selectorArray);
}

function getTypes(selectorArray) {
  return filterForStart(/[^#\.\[\*]/, selectorArray);
}

function filterForStart(pattern, arr) {
  return _.filter(arr, function(str) {
    return pattern.test(str.charAt(0));
  });
}

module.exports = {
  extractSimpleSelectors: extractSimpleSelectors,
  stripPseudosFromSimpleSelector: stripPseudosFromSimpleSelector,
  reduceToSimpleSelectors: reduceToSimpleSelectors,
  getIds: getIds,
  getClasses: getClasses,
  getAttributes: getAttributes,
  getTypes: getTypes
};
