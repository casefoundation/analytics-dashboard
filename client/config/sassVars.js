const theme = require('../src/theme/theme.json');

module.exports = () => {
  const variables = [];
  for(var varName in theme.colors) {
    variables.push('$' + varName + ': ' + theme.colors[varName] + ' !default;\n');
  }
  return variables.join('\n');
}
