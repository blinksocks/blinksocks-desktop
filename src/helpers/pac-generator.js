const fs = require('fs');
const path = require('path');

const adpScripts = fs.readFileSync(path.join(__dirname, './adp-scripts.js'));

module.exports.makePAContent = function makePAContent(rules, host, port) {
  return `
var proxy = "SOCKS5 ${host}:${port}; SOCKS ${host}:${port}; DIRECT;";
var direct = 'DIRECT;';
var rules = ${JSON.stringify(rules, null, '  ')};

${adpScripts}

var defaultMatcher = new CombinedMatcher();

for (var i = 0; i < rules.length; i++) {
  defaultMatcher.add(Filter.fromText(rules[i]));
}

function FindProxyForURL(url, host) {
  if (defaultMatcher.matchesAny(url, host) instanceof BlockingFilter) {
    return proxy;
  }
  return direct;
}
`;
};
