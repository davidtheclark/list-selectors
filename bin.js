#!/usr/bin/env node

'use strict';

var listSelectors = require('./');
var argv = require('minimist')(process.argv.slice(2));

var pretty = argv.p || argv.pretty;
var includes = argv.i || argv.include;
var opts = {};

if (includes) {
  opts.include = includes.split(',');
}

listSelectors(argv._, opts, function(result) {
  var jsonSpacing = (pretty) ? 4 : null;
  process.stdout.write(JSON.stringify(result, null, jsonSpacing));
});
