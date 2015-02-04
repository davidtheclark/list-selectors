#!/usr/bin/env node

'use strict';

var listSelectors = require('./');
var argv = require('minimist')(process.argv.slice(2));

var pretty = argv.p || argv.pretty;

listSelectors(argv._, function(result) {
  var jsonSpacing = (pretty) ? 4 : null;
  process.stdout.write(JSON.stringify(result, null, jsonSpacing));
});
