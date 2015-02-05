[![Build Status](https://travis-ci.org/davidtheclark/list-selectors.svg?branch=master)](https://travis-ci.org/davidtheclark/list-selectors)

> IN THE WORKS NOT READY YET

# list-selectors

What do you want in life? Is it to generate a nicely organized list of all the selectors used in your CSS, showing

- all the selectors *sequences* used anywhere, in the order of usage;
- all the *simple selectors* extracted from those sequences, in alphabetical order;
- those simple selectors broken out into *id*, *class*, *attribute*, and *type* selector categories (also alphabetical)?

That's probably what you want. And your dreams have been realized: this plugin does those things!

It can be used as a standalone Node function, a CLI, or a [PostCSS](https://github.com/postcss/postcss) plugin -- so it's bound to fit into your workflow.

## What it Does

PostCSS parses the stylesheet(s) so that `list-selectors` can aggregate a list of all the selector sequences used. Then it picks apart those sequences, extracts the simple selectors, sorts and categorizes them, and spits out an object -- with which you can do what you will.

Here's a breakdown of the output object:

```js
// Your Selectors
{
  all: [
    // An array of all the selector SEQUENCES used in the input CSS,
    // **in order of appearance**.
  ],
  simpleSelectors: {
    all: [
      // An array of all the SIMPLE selectors used in the input CSS,
      // **in alphabetical order**. These have been extracted from the
      // selector sequences and stripped of pseudo-classes and pseudo-selectors.
      //
      // The ordering ignores the initial `.`, `#`, and `[` that distinguish selectors,
      // so you'll get `['#goo', '.faz', '[href="..."]']` in that order. See?
      //
      // This list will include the universal selector, `*`, if you use it.
    ],
    attributes: [
      // An array of all the simple attribute selectors used, in alphabetical order.
    ],
    classes: [
      // An array of all the simple class selectors used, in alphabetical order.
    ],
    ids: [
      // An array of all the simple id selectors used, in alphabetical order.
    ],
    types: [
      // An array of all the simple type selectors used, in alphabetical order.
    ]
  }
}
```

## Why?

We all have our own reasons for wanting tools like this. Often it's a matter of the heart, very personal, hardly worth discussing with others. But if you need a prompt, here are some situations in which you might find `list-selectors` useful:

- You want an overview of what's going on in some CSS. A nice organized list of all the selectors in play would no doubt help.
- In CSS code-reviews, you want to ensure that selectors adhere to some established conventions (e.g. SUIT or BEM format, no ids, prefixed classes, whatever else). With this list, you can easily scan through all the selectors and assess conformance.
- You want a quick look at how Person-or-Company X that you admire writes CSS selectors, names classes, etc. So feed their CSS (even minified) into one end of the tube, and get a selector list out the other end.
- You want to write a script that compares the selectors your team has actually used against a list of selectors that you are allowing yourself. This plugin will give you the "actual" (to be compred to the "expected").

And so on.

## Usage

### As a Standalone Function

Feed it globs of files and a callback that will receive the selector list object.

You can feed it a single glob or an array of globs that will work together. This is made possible by [multimatch](https://github.com/sindresorhus/multimatch); if you'd like more details about usage and expected matches, have a look at [the multimatch tests](https://github.com/sindresorhus/multimatch/blob/master/test.js).

```js
var listSelectors = require('list-selectors');

listSelectors(['style/**/*.css', '!style/normalize.css'], function(myList) {
  console.log(myList);
  // ... do some other things with your nice new selector list
});

```

### As a CLI

As with the standalone function, you feed it globs of files. In this case, the output is converted to a string with `JSON.stringify()` and written to `stdout`. So you can read it in your terminal, or pipe it to a file or another process.

There is one option: `-p` or `--pretty`. This will add line breaks and tabs to make the JSON more legible, if your goal is to read it with human eyes.

```bash
list-selectors style/**/*.css !style/normalize.css

list-selectors foo.css
# {"all":[".horse","#donkey","[data-type='mule']"],"simpleSelectors":{"all":["[data-type='mule']","#donkey",".horse"],"ids":["#donkey"],"classes":[".horse"],"attributes":["[data-type='mule']"],"types":[]}}

list-selectors foo.css -p
# {
#     "all": [
#         ".horse",
#         "#donkey",
#         "[data-type='mule']"
#     ],
#     "simpleSelectors": {
#         "all": [
#             "[data-type='mule']",
#             "#donkey",
#             ".horse"
#         ],
#         "ids": [
#             "#donkey"
#         ],
#         "classes": [
#             ".horse"
#         ],
#         "attributes": [
#             "[data-type='mule']"
#         ],
#         "types": []
#     }
# }
```

### As PostCSS Plugin

Consume it as a PostCSS plugin, in accordance with however you like to consume PostCSS plugins.

When you use it, pass it a callback that will receive the output object. Then have your way with it.

Straight PostCSS:
```js
var postcss = require('postcss');
var listSelectors = require('listSelectors');

var result;
var css = fs.readFileSync('foo.css', 'utf8');
postcss(listSimpleSelectors(function(list) { result = list; }))
  .process(css);
console.log(result);
// ... do other things with result
```

Or with Gulp and [gulp-postcss](https://github.com/w0rm/gulp-postcss), you can just string it in there with your other plugins.

```js
var gulp = require('gulp');
var gulpPostcss = require('gulp-postcss');
var listSelectors = require('listSelectors');
var customProperties = require('postcss-custom-properties');

gulp.task('analyzeCss', function() {
  return gulp.src(['style/**/*.css', '!style/normalize.css'])
    .pipe(postcss([
      customProperties(),
      listSelectors(doSomethingWithList)
    ]))
    .pipe(gulp.dest('./dest'));
});

function doSomethingWithList(list) {
  console.log(list);
  // ... do other things
}
```
