'use strict';

var fs = require('fs');
var test = require('tape');
var _ = require('lodash');
var postcss = require('postcss');
var selectorProcessors = require('../lib/selectorProcessors');
var listSelectors = require('..');

var getExpected = _.memoize(function(name) {
  return require('./fixtures/' + name + '.expected.js');
});

var getFixture = _.memoize(function(name) {
  return fs.readFileSync('test/fixtures/' + name + '.css', 'utf8');
});

function processFixture(name, opts) {
  opts = opts || {};
  var result;
  postcss(listSelectors(opts, function(list) { result = list; }))
    .process(getFixture(name));
  return result;
}

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

test('standalone', function(t) {
  t.deepEqual(processFixture('basic'), getExpected('basic'));
  t.deepEqual(
    processFixture('basic', { include: 'ids' }),
    { 'ids': getExpected('basic').simpleSelectors.ids },
    'ids only (include option is string)'
  );
  t.deepEqual(
    processFixture('basic', { include: 'attributes' }),
    { 'attributes': getExpected('basic').simpleSelectors.attributes },
    'attributes only'
  );
  t.deepEqual(
    processFixture('basic', { include: 'types' }),
    { 'types': getExpected('basic').simpleSelectors.types },
    'types only'
  );
  t.deepEqual(
    processFixture('basic', { include: 'classes' }),
    { 'classes': getExpected('basic').simpleSelectors.classes },
    'classes only'
  );
  t.deepEqual(
    processFixture('basic', { include: ['ids'] }),
    { 'ids': getExpected('basic').simpleSelectors.ids },
    'ids only (include option is array)'
  );
  t.deepEqual(
    processFixture('basic', { include: ['ids', 'types'] }),
    {
      'ids': getExpected('basic').simpleSelectors.ids,
      'types': getExpected('basic').simpleSelectors.types
    },
    'ids and types only');
  t.deepEqual(
    processFixture('basic', { include: 'simple' }),
    { simpleSelectors: getExpected('basic').simpleSelectors.all },
    'simpleSelectors only'
  );
  t.deepEqual(
    processFixture('basic', { include: 'simpleSelectors' }),
    { simpleSelectors: getExpected('basic').simpleSelectors.all },
    'simpleSelectors only'
  );
  t.deepEqual(
    processFixture('basic', { include: 'selectors' }),
    { selectors: getExpected('basic').selectors },
    'full selectors only'
  );
  t.end();
});

test('postcss plugin', function(t) {
  t.plan(2);
  listSelectors('./test/fixtures/basic.css', function(standaloneResult) {
    t.deepEqual(
      processFixture('basic'),
      standaloneResult,
      'standalone output and postcss output match'
    );
  });
  listSelectors(
    './test/fixtures/basic.css',
    { include: ['ids', 'classes'] },
    function(standaloneResult) {
      t.deepEqual(
        processFixture('basic', { include: ['ids', 'classes'] }),
        standaloneResult,
        'standalone output and postcss output match with include option'
      );
    }
  );
});

test('skip keyframes', function(t) {
  t.deepEqual(processFixture('keyframes'), {});
  t.end();
});

var remoteBasic = 'https://raw.githubusercontent.com/davidtheclark/list-selectors/master/test/fixtures/basic.css';

test('remote', function(t) {
  t.plan(1);
  listSelectors(remoteBasic, function(result) {
    t.deepEqual(result, getExpected('basic'));
  });
});

test('responds to mistakes', function(t) {
  t.plan(3);
  listSelectors('./test/fixtures/doesnotexist.css', function(result) {
    t.deepEqual(result, {}, 'nonexistant local source returns {}');
  });
  listSelectors('http://google.com/doesnotexist.css', function(result) {
    t.deepEqual(result, {}, 'nonexistant local source returns {}');
  });
  listSelectors('./test/fixtures/empty.css', function(result) {
    t.deepEqual(result, {}, 'empty stylesheet returns {}');
  });
});
