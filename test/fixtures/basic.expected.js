module.exports = {
  'selectors': [
    '*',
    '[attribute]',
    '.class',
    '.class:hover',
    '.class::before',
    '.class:first-child',
    '.class:not(.class8)',
    '.class + .class5',
    '.class .class3',
    '.class > .class4',
    '.class ~ .class6',
    '.class.class2',
    '.class7',
    'div',
    '#id',
    '#id2',
    'span'
  ],
  'simpleSelectors': {
    'all': [
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
    'ids': [
      '#id',
      '#id2'
    ],
    'classes': [
      '.class',
      '.class2',
      '.class3',
      '.class4',
      '.class5',
      '.class6',
      '.class7',
      '.class8'
    ],
    'attributes': [
      '[attribute]'
    ],
    'types': [
      'div',
      'span'
    ]
  }
};
