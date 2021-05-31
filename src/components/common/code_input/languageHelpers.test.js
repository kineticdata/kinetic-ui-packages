import {
  processErbTemplate,
  processJavaScript,
  processJavaScriptTemplate,
  processRuby,
} from './languageHelpers';

describe('processErbTemplate', () => {
  test('simple tokens', () => {
    expect(processErbTemplate("Hello <%= @results['Person'] %>")).toEqual([
      ['Hello '],
      ['<%=', 'opening-tag', 'erb'],
      [' ', 'erb'],
      ['@results', 'variable', 'erb'],
      ['[', 'punctuation', 'erb'],
      ["'Person'", 'string', 'erb'],
      [']', 'punctuation', 'erb'],
      [' ', 'erb'],
      ['%>', 'closing-tag', 'erb'],
      [''],
    ]);
  });

  test('should allow %> inside a string', () => {
    expect(processErbTemplate("Hello <%= '%>' %>")).toEqual([
      ['Hello '],
      ['<%=', 'opening-tag', 'erb'],
      [' ', 'erb'],
      ["'%>'", 'string', 'erb'],
      [' ', 'erb'],
      ['%>', 'closing-tag', 'erb'],
      [''],
    ]);
  });

  test('% and > need to be immediately adjacent', () => {
    expect(processErbTemplate('Hello <%= % > %>')).toEqual([
      ['Hello '],
      ['<%=', 'opening-tag', 'erb'],
      [' ', 'erb'],
      ['%', 'operator', 'erb'],
      [' ', 'erb'],
      ['>', 'operator', 'erb'],
      [' ', 'erb'],
      ['%>', 'closing-tag', 'erb'],
      [''],
    ]);
  });

  test('string using %>FOO> syntax should have the %> treated as closing tag', () => {
    expect(processErbTemplate('Hello <%= %>FOO>')).toEqual([
      ['Hello '],
      ['<%=', 'opening-tag', 'erb'],
      [' ', 'erb'],
      ['%>', 'closing-tag', 'erb'],
      ['FOO>'],
    ]);
  });
});

describe('processJavaScript', () => {
  test('simple tokens', () => {
    expect(processJavaScript("'Hello ' + values('First Name')")).toEqual([
      ["'Hello '", 'string'],
      [' '],
      ['+', 'operator'],
      [' '],
      ['values', 'function'],
      ['(', 'punctuation'],
      ["'First Name'", 'string'],
      [')', 'punctuation'],
    ]);
  });

  test('string with interpolation', () => {
    expect(
      // eslint-disable-next-line no-template-curly-in-string
      processJavaScript("foo 'Prefix' + `Hello ${ values('First Name') }`"),
    ).toEqual([
      ['foo '],
      ["'Prefix'", 'string'],
      [' '],
      ['+', 'operator'],
      [' '],
      ['`', 'template-punctuation', 'template-string'],
      ['Hello ', 'string', 'template-string'],
      ['${', 'interpolation-punctuation', 'interpolation', 'template-string'],
      [' ', 'interpolation', 'template-string'],
      ['values', 'function', 'interpolation', 'template-string'],
      ['(', 'punctuation', 'interpolation', 'template-string'],
      ["'First Name'", 'string', 'interpolation', 'template-string'],
      [')', 'punctuation', 'interpolation', 'template-string'],
      [' ', 'interpolation', 'template-string'],
      ['}', 'interpolation-punctuation', 'interpolation', 'template-string'],
      ['`', 'template-punctuation', 'template-string'],
    ]);
  });

  test('nested interpolation', () => {
    // eslint-disable-next-line no-template-curly-in-string
    expect(processJavaScript('`${`${2}`}`')).toEqual([
      ['`', 'template-punctuation', 'template-string'],
      ['${', 'interpolation-punctuation', 'interpolation', 'template-string'],
      [
        '`',
        'template-punctuation',
        'template-string',
        'interpolation',
        'template-string',
      ],
      [
        '${',
        'interpolation-punctuation',
        'interpolation',
        'template-string',
        'interpolation',
        'template-string',
      ],
      [
        '2',
        'number',
        'interpolation',
        'template-string',
        'interpolation',
        'template-string',
      ],
      [
        '}',
        'interpolation-punctuation',
        'interpolation',
        'template-string',
        'interpolation',
        'template-string',
      ],
      [
        '`',
        'template-punctuation',
        'template-string',
        'interpolation',
        'template-string',
      ],
      ['}', 'interpolation-punctuation', 'interpolation', 'template-string'],
      ['`', 'template-punctuation', 'template-string'],
    ]);
  });

  test('IIFE', () => {
    expect(
      processJavaScript('(function(input) { console.log(input); })()'),
    ).toEqual([
      ['(', 'punctuation'],
      ['function', 'keyword'],
      ['(', 'punctuation'],
      ['input', 'parameter'],
      [')', 'punctuation'],
      [' '],
      ['{', 'punctuation'],
      [' console'],
      ['.', 'punctuation'],
      ['log', 'function'],
      ['(', 'punctuation'],
      ['input'],
      [')', 'punctuation'],
      [';', 'punctuation'],
      [' '],
      ['}', 'punctuation'],
      [')', 'punctuation'],
      ['(', 'punctuation'],
      [')', 'punctuation'],
    ]);
  });
});

describe('processJavaScriptTemplate', () => {
  test('simple tokens', () => {
    // eslint-disable-next-line no-template-curly-in-string
    expect(processJavaScriptTemplate("Hello ${values('First Name')}")).toEqual([
      ['Hello '],
      ['${', 'opening-interpolation', 'js-template'],
      ['values', 'function', 'js-template'],
      ['(', 'punctuation', 'js-template'],
      ["'First Name'", 'string', 'js-template'],
      [')', 'punctuation', 'js-template'],
      ['}', 'closing-interpolation', 'js-template'],
      [''],
    ]);
  });

  test('add some objects inside to test curly behavior', () => {
    // eslint-disable-next-line no-template-curly-in-string
    expect(processJavaScriptTemplate('Hello ${{foo:{"bar":2}}}')).toEqual([
      ['Hello '],
      ['${', 'opening-interpolation', 'js-template'],
      ['{', 'punctuation', 'js-template'],
      ['foo', 'js-template'],
      [':', 'operator', 'js-template'],
      ['{', 'punctuation', 'js-template'],
      ['"bar"', 'string', 'js-template'],
      [':', 'operator', 'js-template'],
      ['2', 'number', 'js-template'],
      ['}', 'punctuation', 'js-template'],
      ['}', 'punctuation', 'js-template'],
      ['}', 'closing-interpolation', 'js-template'],
      [''],
    ]);
  });

  test('multiple interpolations', () => {
    // eslint-disable-next-line no-template-curly-in-string
    expect(processJavaScriptTemplate('Hello ${2} World${"1"}')).toEqual([
      ['Hello '],
      ['${', 'opening-interpolation', 'js-template'],
      ['2', 'number', 'js-template'],
      ['}', 'closing-interpolation', 'js-template'],
      [' World'],
      ['${', 'opening-interpolation', 'js-template'],
      ['"1"', 'string', 'js-template'],
      ['}', 'closing-interpolation', 'js-template'],
      [''],
    ]);
  });
});

describe('processRuby', () => {
  test('simple tokens', () => {
    expect(processRuby("'Hello ' + @results['Person']")).toEqual([
      ["'Hello '", 'string'],
      [' '],
      ['+', 'operator'],
      [' '],
      ['@results', 'variable'],
      ['[', 'punctuation'],
      ["'Person'", 'string'],
      [']', 'punctuation'],
    ]);
  });

  test('string with interpolation', () => {
    expect(processRuby("%^Hello #{ @results['Person'] }^")).toEqual([
      ['%^Hello ', 'string'],
      ['#{', 'delimiter', 'interpolation', 'string'],
      [' ', 'interpolation', 'string'],
      ['@results', 'variable', 'interpolation', 'string'],
      ['[', 'punctuation', 'interpolation', 'string'],
      ["'Person'", 'string', 'interpolation', 'string'],
      [']', 'punctuation', 'interpolation', 'string'],
      [' ', 'interpolation', 'string'],
      ['}', 'delimiter', 'interpolation', 'string'],
      ['^', 'string'],
    ]);
  });

  test('nested interpolation', () => {
    expect(processRuby('"#{"#{2}"}"')).toEqual([
      ['"', 'string'],
      ['#{', 'delimiter', 'interpolation', 'string'],

      // prism's ruby parser does not support nested interpolation (thinks its a
      // comment) the commented code below is what it should be if it did
      // support that properly
      // ['"', 'string', 'interpolation', 'string'],
      // ['#{', 'delimiter', 'interpolation', 'string', 'interpolation', 'string'],
      // ['2', 'number', 'interpolation', 'string', 'interpolation', 'string'],
      // ['}', 'delimiter', 'interpolation', 'string', 'interpolation', 'string'],
      // ['"', 'string', 'interpolation', 'string'],
      // ['}', 'delimiter', 'interpolation', 'string'],
      // ['"', 'string'],

      // the following is the resulting remainder due to the prism issue
      ['"', 'interpolation', 'string'],
      ['#{2', 'comment', 'interpolation', 'string'],
      ['}', 'delimiter', 'interpolation', 'string'],
      ['"', 'string'],
      ['}', 'punctuation'],
      ['"'],
    ]);
  });
});
