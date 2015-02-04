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
  return _.filter(selectorArray, function(selector) {
    return _.startsWith(selector, '#');
  });
}

function getClasses(selectorArray) {
  return _.filter(selectorArray, function(selector) {
    return _.startsWith(selector, '.');
  });
}

function getAttributes(selectorArray) {
  return _.filter(selectorArray, function(selector) {
    return _.startsWith(selector, '[');
  });
}

function getTypes(selectorArray) {
  return _.filter(selectorArray, function(selector) {
    return !selector.charAt(0).match(/[#\.\[\*]/);
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
