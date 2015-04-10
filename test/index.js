'use strict';

var fs = require('fs');
var test = require('tape');
var _ = require('lodash');
var postcss = require('postcss');
var logWarnings = require('postcss-log-warnings');
var listSelectors = require('../index.js');

require('./processors');

var getExpected = _.memoize(function(name) {
  return require('./fixtures/' + name + '.expected.js');
});

var getFixture = _.memoize(function(name) {
  return fs.readFileSync('test/fixtures/' + name + '.css', 'utf8');
});

function processFixture(name, opts, cb) {
  var fixtureList;
  postcss()
    .use(listSelectors.plugin(opts, function(list) { fixtureList = list; }))
    .use(logWarnings({ plugins: ['list-selectors'] }))
    .process(getFixture(name))
    .then(function() {
      cb(fixtureList);
    })
    .catch(function(err) {
      console.error(err.stack);
    });
}

test('postcss plugin', function(t) {
  t.plan(11);

  processFixture('basic', null, function(list) {
    t.deepEqual(list, getExpected('basic'));
  });

  processFixture('basic', { include: 'ids' }, function(list) {
    t.deepEqual(list,
      { 'ids': getExpected('basic').simpleSelectors.ids },
      'ids only (include option is string)'
    );
  });

  processFixture('basic', { include: 'attributes' }, function(list) {
    t.deepEqual(list, { 'attributes': getExpected('basic').simpleSelectors.attributes },
      'attributes only');
  });

  processFixture('basic', { include: 'types' }, function(list) {
    t.deepEqual(list, { 'types': getExpected('basic').simpleSelectors.types },
      'types only');
  });

  processFixture('basic', { include: 'classes' }, function(list) {
    t.deepEqual(list, { 'classes': getExpected('basic').simpleSelectors.classes },
      'classes only');
  });

  processFixture('basic', { include: ['ids'] }, function(list) {
    t.deepEqual(list, { 'ids': getExpected('basic').simpleSelectors.ids },
      'ids only (include option is array)');
  });

  processFixture('basic', { include: ['ids', 'types'] }, function(list) {
    t.deepEqual(list, {
        ids: getExpected('basic').simpleSelectors.ids,
        types: getExpected('basic').simpleSelectors.types
      },
      'ids and types only');
  });

  processFixture('basic', { include: 'simple' }, function(list) {
    t.deepEqual(list, { simpleSelectors: getExpected('basic').simpleSelectors.all },
      'simple only');
  });

  processFixture('basic', { include: 'simpleSelectors' }, function(list) {
    t.deepEqual(list, { simpleSelectors: getExpected('basic').simpleSelectors.all },
      'simpleSelectors only');
  });

  processFixture('basic', { include: 'selectors' }, function(list) {
    t.deepEqual(list, { selectors: getExpected('basic').selectors },
      'full selectors only');
  });

  processFixture('readme', {}, function(list) {
    t.deepEqual(list, getExpected('readme'),
      'readme example');
  });
});

test('postcss plugin', function(t) {
  t.plan(2);

  listSelectors('./test/fixtures/basic.css', function(standaloneResult) {
    processFixture('basic', null, function(list) {
      t.deepEqual(list, standaloneResult,
        'standalone output and postcss output match'
      );
    });
  });

  listSelectors(
    './test/fixtures/basic.css',
    { include: ['ids', 'classes'] },
    function(standaloneResult) {
      processFixture('basic', { include: ['ids', 'classes'] }, function(list) {
        t.deepEqual(list, standaloneResult,
          'standalone output and postcss output match with include option'
        );
      });
    }
  );
});

test('skip keyframes', function(t) {
  processFixture('keyframes', null, function(list) {
    t.deepEqual(list, {}, 'keyframes were skipped');
    t.end();
  });
});

var remoteBasic = 'https://raw.githubusercontent.com/davidtheclark/list-selectors/master/test/fixtures/basic.css';

test('remote', function(t) {
  listSelectors(remoteBasic, function(list) {
    t.deepEqual(list, getExpected('basic'));
    t.end();
  });
});

test('remote responds to mistakes', function(t) {
  t.plan(3);
  listSelectors('./test/fixtures/doesnotexist.css', function(list) {
    t.deepEqual(list, {}, 'nonexistant local source returns {}');
  });
  listSelectors('http://google.com/doesnotexist.css', function(list) {
    t.deepEqual(list, {}, 'nonexistant remote source returns {}');
  });
  listSelectors('./test/fixtures/empty.css', function(list) {
    t.deepEqual(list, {}, 'empty stylesheet returns {}');
  });
});
