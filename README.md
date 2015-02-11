[![Build Status](https://travis-ci.org/davidtheclark/list-selectors.svg?branch=master)](https://travis-ci.org/davidtheclark/list-selectors)

> IN THE WORKS NOT READY YET

# list-selectors

What do you want in life? Is it to generate a nicely organized list of all the selectors used in your CSS, showing

- all the unique *selectors* used anywhere, in alphabetical order;
- all the unique *simple selectors* extracted from those sequences, in alphabetical order;
- those unique simple selectors broken out into *id*, *class*, *attribute*, and *type* selector categories (also alphabetical)?

Yes, that is probably what you want. And your dreams have been realized: this plugin does those things!

It can be used as a standalone Node function, a CLI, or a [PostCSS](https://github.com/postcss/postcss) plugin -- so it's bound to fit into your workflow.

## What it Does

While PostCSS parses the stylesheet(s), `list-selectors` aggregates a list of all the selectors used. Then it alphabetizes the selectors, extracts the simple selectors, sorts and categorizes those, and spits out an object -- with which you can do what you will.

Here's a breakdown of the output object:

```js
// Your Selectors
//
// All the lists are **in alphabetical order** and **without reptition**,
// unique values only.
//
// The ordering ignores the initial `.`, `#`, and `[` that distinguish selectors,
// so you'll get `['#goo', '.faz', '[href="..."]']` in that order.
{
  selectors: [
    // An array of all the unique selectors used in the input CSS.
  ],
  simpleSelectors: {
    all: [
      // An array of all the unique SIMPLE selectors used in the input CSS.
      // These have been extracted from the
      // selectors and stripped of pseudo-classes and pseudo-selectors.
      //
      // This list will include the universal selector, `*`, if you use it.
    ],
    attributes: [
      // An array of all the unique attribute selectors used.
    ],
    classes: [
      // An array of all the unique class selectors used.
    ],
    ids: [
      // An array of all the unique id selectors used.
    ],
    types: [
      // An array of all the unique type selectors used.
    ]
  }
}
```

## Why?

We all have our own reasons for wanting tools like this. Often it's a matter of the heart, very personal, hardly worth discussing with others. But if you need a prompt, here are some situations in which you might find `list-selectors` useful:

- You want an overview of what's going on in some CSS. A nice organized list of all the selectors in play would no doubt help.
- In CSS code-reviews, you want to ensure that selectors adhere to some established conventions (e.g. SUIT or BEM format, no ids, prefixed classes, whatever else). With this list, you can easily scan through all the selectors and assess conformance.
- You want a quick look at how Person-or-Company X that you admire writes CSS selectors, names classes, etc. So feed their CSS (even minified) into one end of the tube, and get a selector list out the other end.
- You want to write a script that compares the selectors your team has actually used against a list of selectors that you are allowing yourself. This plugin will give you the "actual" (which you could compare with the "expected").

And so on.

## Usage

### listSelectors(source[, options], callback)

Use it as a standalone Node function. Feed it globs of files or a URL, (optional) options, and a callback that will receive the selector list object.

* **{string|string[]} source** - Can be a single file glob, or an array of file globs that work together, or the URL of a remote CSS file. The array of file globs is made possible by [multimatch](https://github.com/sindresorhus/multimatch); so if you'd like more details about usage and expected matches, have a look at [the multimatch tests](https://github.com/sindresorhus/multimatch/blob/master/test.js).
* **{object} [options]** - Optional options: see [Options](#options).
* **{function} callback** - A callback function that will receive the generated list as an argument. *If no selectors are found, it will receive an empty object.*

#### Example

```js
var listSelectors = require('list-selectors');

listSelectors(
  ['style/**/*.css', '!style/normalize.css'], // glob
  { include: ['ids', 'classes'] }, // options
  function(myList) { // callback
    console.log(myList);
    // ... do other things with your nice selector list
  }
);

```

### As a CLI

As with the standalone function, you feed it globs of files and options; and you pass an array of globs to make [multimatch](https://github.com/sindresorhus/multimatch) patterns (*however*, if you use `!` or other special characters in your file globs, make sure that you wrap the glob in quotation marks or else your terminal will get flummoxed -- see the last example below); and you can pass a URL to a remote CSS file.

The output is converted to a string with `JSON.stringify()` and written to `stdout`. So you can read it in your terminal or pipe it to a file or another process.

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

# Using a ! -- notice the quotation marks
list-selectors 'style/**/*.css' '!style/normalize.css'
```

### As PostCSS Plugin

Consume it as a PostCSS plugin, in accordance with your chosen method of consuming PostCSS plugins.

Pass it (optional options) and a callback that will receive the output object. Then have your way with it.

#### Examples

Straight PostCSS:
```js
var postcss = require('postcss');
var listSelectors = require('listSelectors');

var result;
var css = fs.readFileSync('foo.css', 'utf8');
var listOpts = { include: 'ids' };
postcss(listSimpleSelectors(listOpts, function(list) { result = list; }))
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

## Options

### include {string|string[]}

Only include a subset of lists in the output.

Options:
- `'selectors'`: Only the complete list of full selectors.
- `'simpleSelectors'`: Only the complete list of simple selectors.
- `'simple'`: Same as `'simpleSelectors'`.
- `'attributes'`: Only attributes.
- `'classes'`: Only classes.
- `'ids'`: Only ids.
- `'types'`: Only types.

## Caveats

- Anything within parentheses will be ignored. One situation in which you might use a selector in parentheses is with `:not`, e.g. `.foo:not(.bar)` --- and in that case, `.bar` will not be included in the list (unless it's used elsewhere).
