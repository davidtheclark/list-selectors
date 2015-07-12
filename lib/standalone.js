'use strict';

var fs = require('fs');
var _ = require('lodash');
var postcss = require('postcss');
var request = require('request');
var chalk = require('chalk');
var globby = require('globby');
var reporter = require('postcss-reporter');
var plugin = require('./plugin');

/**
 * When using listSelectors as a standalone function or via CLI, we'll need
 * to get the source files before processing. They might be local,
 * identified with globs, or remote, identified with a URL.
 * Get the source files, accumulate them into a string, then
 * run that string through postcss with listSelectors.plugin.
 *
 * @param {string|string[]} source - A glob (or globs) or a URL
 * @param {object|function} [options] - If this is a function, it will be interpreted
 *   as the callback
 * @param {function} [callback] - A callback that will receive the result list of selectors
 *   as an argument
 */
module.exports = function(source, options, callback) {
  var opts, cb;
  if (_.isFunction(options)) {
    opts = {};
    cb = options;
  } else {
    opts = options || {};
    cb = callback || _.noop;
  }

  var fullCss = '';

  if (_.startsWith(source, 'http')) {
    processRemoteCss();
  } else {
    processLocalCss();
  }

  function processRemoteCss() {
    var url = (_.isArray(source)) ? source[0] : source;
    request(url, function(err, resp, body) {
      if (err) throw err;
      if (resp.statusCode !== 200) {
        console.log(
          chalk.red('Failed to fetch ') + chalk.yellow.underline(url) +
          chalk.red('. Maybe you flubbed the url?')
        );
        body = '';
      }
      postcss()
        .use(plugin(opts, cb))
        .use(reporter({ plugins: ['list-selectors'] }))
        .process(body)
        .then(_.noop, function(errB) {
          console.error(errB.stack);
        });
    });
  }

  function processLocalCss() {
    globby(source, function(err, filePaths) {
      if (err) throw err;

      if (!filePaths.length) {
        console.log(
          chalk.red('Failed to find any files matching your glob ') +
          chalk.yellow.underline(source)
        );
      }

      filePaths.forEach(function(filePath) {
        fullCss += fs.readFileSync(filePath, { encoding: 'utf8' });
      });

      postcss()
        .use(plugin(opts, cb))
        .use(reporter({ plugins: ['list-selectors'] }))
        .process(fullCss)
        .then(_.noop, function(errB) {
          console.error(errB.stack);
        });
    });
  }
};
