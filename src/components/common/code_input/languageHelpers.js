import Prism from 'prismjs';
import 'prismjs/components/prism-markup-templating.js';
import 'prismjs/components/prism-ruby.js';
import { isArray, isString, isUndefined } from 'lodash-es';

const processToken = (...parentTypes) => token => {
  if (isString(token)) {
    return [[token, ...parentTypes]];
  } else if (isString(token.content)) {
    return isUndefined(token.type)
      ? [[token.content, ...parentTypes]]
      : [[token.content, token.type, ...parentTypes]];
  } else if (isArray(token.content)) {
    return token.content.flatMap(processToken(token.type, ...parentTypes));
  }
};

export const processCode = language => (string, ...parentTypes) =>
  Prism.tokenize(string, language).flatMap(processToken(...parentTypes));

export const processJavaScript = processCode(Prism.languages.javascript);
export const processRuby = processCode(Prism.languages.ruby);

const countLength = tokens =>
  tokens.reduce((reduction, [tokenValue]) => reduction + tokenValue.length, 0);

const processEmbeddedRuby = string => {
  const result = [
    [string.startsWith('<%=') ? '<%=' : '<%', 'opening-tag', 'erb'],
  ];
  const rest = string.slice(result[0][0].length);
  let done = false;
  let foundPercent = null;
  processRuby(rest, 'erb').forEach(token => {
    const [content, type] = token;
    if (!done) {
      // Handle the check for closing tag. If the previous character was a %
      // operator check to see if the current character is a > operator. If so
      // add the closing tag and we are done. Otherwise add the previously found
      // % token to the result.
      if (foundPercent) {
        if (type === 'operator' && content === '>') {
          result.push(['%>', 'closing-tag', 'erb']);
          done = true;
        } else {
          result.push(foundPercent);
          foundPercent = null;
        }
      }
      // Handle the current token.
      if (!done) {
        // If it is a % operator this may be the closing tag so we don't add
        // it yet, set `foundPercent` and continue.
        if (type === 'operator' && content === '%') {
          foundPercent = token;
          // It may also be a string token with the %>foo> delimiter syntax, in
          // this case we actually want to treat that as our closing tag.
        } else if (type === 'string' && content.startsWith('%>')) {
          result.push(['%>', 'closing-tag', 'erb']);
          done = true;
          // Otherwise just add the token
        } else {
          result.push(token);
        }
      }
    }
  });
  return result.concat(processErbTemplate(string.slice(countLength(result))));
};

const processInterpolation = string => {
  const result = [['${', 'opening-interpolation', 'js-template']];
  const rest = string.slice(2);
  // track the number of opening curly braces, when the number of closing curly
  // braces exceeds the opening ones we consider the interpolation completed
  let curlyDepth = 0;
  // use `some` instead of `forEach` so we can break early by returning true
  processJavaScript(rest, 'js-template').some(token => {
    const [content, type] = token;
    if (content === '}' && type === 'punctuation' && curlyDepth === 0) {
      result.push(['}', 'closing-interpolation', 'js-template']);
      return true;
    } else {
      if (content === '{' && type === 'punctuation') {
        curlyDepth++;
      } else if (content === '}' && type === 'punctuation') {
        curlyDepth--;
      }
      result.push(token);
      return false;
    }
  });
  return result.concat(
    processJavaScriptTemplate(string.slice(countLength(result))),
  );
};

export const processTemplate = (openingString, processor) => string => {
  const openingIndex = string.indexOf(openingString);
  return openingIndex > -1
    ? [
        [string.slice(0, openingIndex)],
        ...processor(string.slice(openingIndex)),
      ]
    : [[string]];
};

export const processErbTemplate = processTemplate('<%', processEmbeddedRuby);
export const processJavaScriptTemplate = processTemplate(
  '${',
  processInterpolation,
);
