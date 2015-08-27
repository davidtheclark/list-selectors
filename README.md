# list-selectors [![Build Status](https://travis-ci.org/davidtheclark/list-selectors.svg?branch=master)](https://travis-ci.org/davidtheclark/list-selectors)

What do you want in life? Is it to generate a nicely organized list of all the selectors used in your CSS, showing

- all the unique *selectors* used anywhere, in alphabetical order;
- all the unique *simple selectors* extracted from those sequences, in alphabetical order;
- those unique simple selectors broken out into *id*, *class*, *attribute*, and *type* selector categories (also alphabetical)?

Yes, that is probably what you want. And your dreams have been realized: this plugin does those things!

It can be used as a standalone Node function, a CLI, or a [PostCSS](https://github.com/postcss/postcss) plugin — so it's bound to fit into your workflow.

*v0.2.0+ should be used as a PostCSS plugin only with PostCSS v4.1.0+.*

## Installation

```
npm install list-selectors
```

Version 2+ is compatible with PostCSS 5. (Earlier versions are compatible with PostCSS 4.)

## What it Does

While PostCSS parses the input stylesheet(s), `list-selectors` aggregates a list of all the selectors used. Then it alphabetizes them, extracts the simple selectors, sorts and categorizes those, and spits out an object — with which you can do what you will (some ideas [below](#why)).

Here's an example input-output, explaining each part of the output object:

```css
/* INPUT */
.fulvous { color: blue; }
#orotund { color: red; }
.Luddite { color: green; }
ul > li { color: pink; }
a[data-biscuit="dunderfunk"] { color: pink; }
div#antipattern:nth-child(3).horsehair [id="ding"] { color: yellow; }
```

```js
// OUTPUT

// All the lists are *in alphabetical order* with *unique values* only.
//
// The ordering ignores initial characaters that distinguish selectors.
// It also ignores capitalization. So you'd get
// `['#goo', '.faz', '.Freedom', '[href="..."]']` in that order.
{
  selectors: [
    // The selectors used in the input CSS.
    'a[data-biscuit="dunderfunk"]',
    'div#antipattern:nth-child(3).horsehair [id="ding"]',
    '.fulvous',
    '.Luddite',
    '#orotund',
    'ul > li'
  ],
  simpleSelectors: {
    all: [
      // The *simple* selectors used in the input CSS.
      // These have been extracted from the
      // selectors and stripped of pseudo-classes and pseudo-selectors.
      //
      // This list will include the universal selector, `*`, if you use it.
      'a',
      '#antipattern',
      '[data-biscuit="dunderfunk"]',
      'div',
      '.fulvous',
      '.horsehair',
      '[id="ding"]',
      'li',
      '.Luddite',
      '#orotund',
      'ul'
    ],
    attributes: [
      // The attribute selectors used.
      '[data-biscuit="dunderfunk"]',
      '[id="ding"]'
    ],
    classes: [
      // The class selectors used.
      '.fulvous',
      '.horsehair',
      '.Luddite'
    ],
    ids: [
      // The id selectors used.
      '#antipattern',
      '#orotund'
    ],
    types: [
      // The type selectors used.
      'a',
      'div',
      'li',
      'ul'
    ]
  }
}
```

## Why?

Short answer: **code review and analysis**.

We all have our own reasons for wanting the review/analysis tools that we want. But if you need a prompt, here are some situations in which you might find `list-selectors` useful:

- You want an overview of what's going on in some CSS. A nice organized list of all the selectors in play would no doubt help.
- In CSS code-reviews, you want to ensure that selectors adhere to some established conventions (e.g. SUIT or BEM format, no ids, prefixed classes, whatever else). With this list, you can easily scan through all the selectors and assess conformance.
- You want a quick look at how Person-or-Company X that you admire writes CSS selectors, names classes, etc. So feed their CSS (even minified) into one end of the tube, and get a selector list out the other end.
- You want to write a script that compares the selectors your team has actually used against a list of selectors that you are allowing yourself. This plugin will give you the "actual" (which you could compare with the "expected").

And so on.

## Usage

### `listSelectors(source[, options], callback)`

Use it as a standalone Node function. Feed it globs of files or a URL, (optional) options, and a callback that will receive the selector list object.

* **{string|string[]} source** - Can be a single file glob, or an array of file globs that work together, or the URL of a remote CSS file. URLs are identified by an opening `http`, so don't forget that. The array of file globs is made possible by [multimatch](https://github.com/sindresorhus/multimatch); if you'd like more details about usage and expected matches, have a look at [the multimatch tests](https://github.com/sindresorhus/multimatch/blob/master/test.js).
* **{object} [options]** - Optional options: see [Options](#options).
* **{function} callback** - A callback function that will receive the generated list as an argument. If no selectors are found, it will receive an empty object.

#### Example

```js
var listSelectors = require('list-selectors');

listSelectors(
  ['style/**/*.css', '!style/normalize.css'], // source
  { include: ['ids', 'classes'] }, // options
  function(myList) { // callback
    console.log(myList);
    // ... do other things with your nice selector list
  }
);

```

### As a CLI

As with the standalone function, you feed it globs of files and options. You can pass an array of globs to make [multimatch](https://github.com/sindresorhus/multimatch) patterns (*however*, if you use `!` or other special characters in your file globs, make sure that you wrap the glob in quotation marks or else your terminal will be flummoxed — see the last example below); and you can pass a URL to a remote CSS file.

The output is converted to a string with `JSON.stringify()` and written to `stdout`. You can read it in your terminal or pipe it to a file or another process.

#### Flags

* `-p` or `--pretty`: This will add line breaks and tabs to make the JSON more legible, if your goal is to read it with human eyes.
* `-i` or `--include`: See [Options](#options).

#### Example

```bash

list-selectors foo.css
# {"all":[".horse","#donkey","[data-type='mule']"],"simpleSelectors":{"all":["[data-type='mule']","#donkey",".horse"],"ids":["#donkey"],"classes":[".horse"],"attributes":["[data-type='mule']"],"types":[]}}

list-selectors foo.css -p -i classes
# {
#     "classes": [
#         ".horse"
#     ]
# }

# Remote URL
list-selectors https://www.npmjs.com/static/css/index.css

# Using a `!`: notice the quotation marks
list-selectors "style/**/*.css" "!style/normalize.css"
```

### As PostCSS Plugin

Consume it as a [PostCSS](https://github.com/postcss/postcss) plugin, in accordance with your chosen method of consuming PostCSS plugins.

Just use the `plugin` method:

```js
var listSelectorPlugin = require('list-selectors').plugin;
```

Pass it (optional) options and a callback that will receive the output object. Then have your way with it.

#### Examples

With Gulp and [gulp-postcss](https://github.com/w0rm/gulp-postcss), you can just string it in there with your other plugins.

```js
var gulp = require('gulp');
var gulpPostcss = require('gulp-postcss');
var listSelectorsPlugin = require('listSelectors').plugin;
var customProperties = require('postcss-custom-properties');

gulp.task('analyzeCss', function() {
  return gulp.src(['style/**/*.css', '!style/normalize.css'])
    .pipe(postcss([
      customProperties(),
      listSelectorsPlugin(doSomethingWithList)
    ]))
    .pipe(gulp.dest('./dest'));
});

function doSomethingWithList(mySelectorList) {
  console.log(mySelectorList);
  // ... do other things
}
```

Straight PostCSS:

```js
var postcss = require('postcss');
var listSelectorsPlugin = require('listSelectors').plugin;

var mySelectorList;
var css = fs.readFileSync('foo.css', 'utf8');
var listOpts = { include: 'ids' };
postcss(listSelectorsPlugin(listOpts, function(list) { mySelectorList = list; }))
  .process(css)
  .then(function() {
    console.log(mySelectorList);
    // ... do other things with result
  });
```


## Options

### `include` {string|string[]}

Only include a subset of lists in the output.

Possible values are:
- `'selectors'`: Only the complete list of full selectors.
- `'simpleSelectors'`: Only the complete list of simple selectors.
- `'simple'`: Same as `'simpleSelectors'`.
- `'attributes'`: Only attributes.
- `'classes'`: Only classes.
- `'ids'`: Only ids.
- `'types'`: Only types.
