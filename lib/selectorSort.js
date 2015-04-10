'use strict';

/**
 * Used to sort selectors alphabetically, ignoring initial category
 * distinguishing punctuation like `#`, `.`, and `[`.
 *
 * @param {string} selector
 * @return {string} The sortable selector:
 *   lowercased, stripped of initial punctuation
 */
module.exports = function(selector) {
  var lowerNoPseudo = selector.split(':')[0].toLowerCase();
  return (/^[#\.\[]/.test(selector)) ? lowerNoPseudo.substr(1) : lowerNoPseudo;
};
