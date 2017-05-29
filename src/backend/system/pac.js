const http = require('http');
const os = require('os');
const path = require('path');
const readline = require('readline');
const fs = require('fs');
const stream = require('stream');
const logger = require('../helpers/logger');

const adpScripts = fs.readFileSync(path.join(__dirname, '..', 'resources', 'adp-scripts.js'));

class PacService {

  constructor() {
    this._server = null;
  }

  start({host, port, proxyHost, proxyPort, rules}) {
    if (!this._server) {
      const fileData = this._assemble({host: proxyHost, port: proxyPort, rules});
      this._server = http.createServer((req, res) => {
        res.writeHead(200, {
          'Server': 'blinksocks-desktop',
          'Content-Type': 'application/x-ns-proxy-autoconfig',
          'Content-Length': fileData.length,
          'Cache-Control': 'no-cache',
          'Date': (new Date).toUTCString(),
          'Connection': 'Close'
        });
        res.end(fileData);
      });
      this._server.on('clientError', (err, socket) => {
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
      });
      this._server.listen(port, () => {
        logger.info(`started local pac server at ${host}`);
      });
    }
  }

  stop() {
    if (this._server) {
      this._server.close();
      this._server = null;
      logger.info('stopped local pac server');
    }
  }

  _assemble({host, port, rules}) {
    const _rules = JSON.stringify(rules, null, '  ');
    return `
var proxy = "SOCKS5 ${host}:${port}; SOCKS ${host}:${port}; DIRECT;";
var direct = 'DIRECT;';
var rules = ${_rules};

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
  }

}

module.exports = {
  createPacService() {
    return new PacService();
  }
};
