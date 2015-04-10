'use strict';

var test = require('tape');
var selectorProcessors = require('../lib/selectorProcessors');

test('extractSimpleSelectors', function(t) {
  var extract = selectorProcessors.extractSimpleSelectors;
  t.deepEqual(extract('ul li a span'), ['ul', 'li', 'a', 'span']);
  t.deepEqual(extract('ul > li > a > span'), ['ul', 'li', 'a', 'span']);
  t.deepEqual(extract('li + li + li + li'), ['li', 'li', 'li', 'li']);
  t.deepEqual(extract('a ~ a ~ a ~ a'), ['a', 'a', 'a', 'a']);
  t.deepEqual(extract('ul > a[href=">"]'), ['ul', 'a', '[href=">"]']);
  t.deepEqual(extract('.one.two.three'), ['.one', '.two', '.three']);
  t.deepEqual(extract('[one][two][three]'), ['[one]', '[two]', '[three]']);
  t.deepEqual(extract('one#two'), ['one', '#two']);
  t.deepEqual(extract('one.two'), ['one', '.two']);
  t.deepEqual(extract('one[two]'), ['one', '[two]']);
  t.deepEqual(extract('one#two.three[four]'), ['one', '#two', '.three', '[four]']);
  t.deepEqual(extract('[one].two#three'), ['[one]', '.two', '#three']);
  t.deepEqual(extract('a[href^="horse"]'), ['a', '[href^="horse"]']);
  t.deepEqual(extract('span[id="st#upid.hor*se"]'), ['span', '[id="st#upid.hor*se"]']);
  t.deepEqual(extract('.one:not(.two)'), ['.one']);
  t.deepEqual(extract(
    '.uniques-graph .x.axis .tick:nth-child(14) line'),
    ['.uniques-graph', '.x', '.axis', '.tick', 'line']
  );
  t.end();
});

test('stripPseudosFromSimpleSelector', function(t) {
  var strip = selectorProcessors.stripPseudosFromSimpleSelector;
  t.equal(strip('a:hover'), 'a');
  t.equal(strip('#foo:focus'), '#foo');
  t.equal(strip('.foo:active:focus'), '.foo');
  t.equal(strip('[foo]:hover'), '[foo]');
  t.equal(strip('[foo]::before'), '[foo]');
  t.equal(strip('*:active:focus::before'), '*');
  t.equal(strip('#foo:nth-child(7):focus::before'), '#foo');
  t.end();
});

test('reduceToSimpleSelectors', function(t) {
  var reduce = selectorProcessors.reduceToSimpleSelectors;
  t.deepEqual(
    reduce(['.one > #two:active:focus + [three]:hover four::before']),
    ['.one', '#two', '[three]', 'four']
  );
  t.deepEqual(
    reduce(['.one   >   #two:active:focus\n .three[four] \r.five']),
    ['.one', '#two', '.three', '[four]', '.five']
  );
  t.end();
});
