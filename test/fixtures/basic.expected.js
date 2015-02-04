module.exports = {
  all: [
    '*',
    '.class',
    '#id',
    '[attribute]',
    'div',
    '.class.class2',
    '.class .class3',
    '.class > .class4',
    '.class + .class5',
    '.class ~ .class6',
    '.class7',
    '#id2',
    'span',
    '.class:hover',
    '.class::before',
    '.class:first-child',
    '.class:not(.class8)'
  ],
  simpleSelectors: {
    all: [
      '*',
      '[attribute]',
      '.class',
      '.class2',
      '.class3',
      '.class4',
      '.class5',
      '.class6',
      '.class7',
      '.class8',
      'div',
      '#id',
      '#id2',
      'span'
    ],
    attributes: ['[attribute]'],
    classes: [
      '.class',
      '.class2',
      '.class3',
      '.class4',
      '.class5',
      '.class6',
      '.class7',
      '.class8'
    ],
    ids: [ '#id', '#id2' ],
    types: [ 'div', 'span' ]
  }
};
