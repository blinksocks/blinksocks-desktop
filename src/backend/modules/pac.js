const fs = require('fs');
const stream = require('stream');
const readline = require('readline');
const http = require('http');
const os = require('os');
const path = require('path');
const logger = require('../helpers/logger');

const {
  DEFAULT_GFWLIST_PATH
} = require('../constants');

const {
  MAIN_START_PAC,
  MAIN_STOP_PAC,
  RENDERER_START_PAC,
  RENDERER_STOP_PAC
} = require('../../defs/events');

// cache adp-scripts.js into memory
const adpScripts = fs.readFileSync(path.join(__dirname, '..', 'resources', 'adp-scripts.js'));

/**
 * A http service which serves pac file
 */
class PacService {

  constructor() {
    this._server = null;
  }

  isRunning() {
    return this._server !== null;
  }

  start({host, port, proxyHost, proxyPort, rules}) {
    if (!this._server) {
      const fileData = this._assemble({host: proxyHost, port: proxyPort, rules});
      this._server = http.createServer((req, res) => {
        res.writeHead(200, {
          'Server': 'blinksocks-desktop',
          'Content-Type': 'application/x-ns-proxy-autoconfig',
          'Content-Length': fileData.length,
          'Cache-Control': 'max-age=36000',
          'Date': (new Date).toUTCString(),
          'Connection': 'Close'
        });
        res.end(fileData);
      });
      this._server.on('clientError', (err, socket) => {
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
      });
      this._server.listen(port, () => {
        logger.info(`started local pac server at http://${host}:${port}`);
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
var proxy = "SOCKS5 ${host}:${port}; SOCKS ${host}:${port}; PROXY ${host}:${port}; DIRECT;";
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

/**
 * parse gfwlist line by line
 * @param filePath
 * @returns {Promise}
 */
function parseRules(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        const sr = new stream.PassThrough();
        sr.end(Buffer.from(data, 'base64').toString('ascii'));
        const rl = readline.createInterface({input: sr});
        let index = 0;
        const domains = [];
        rl.on('line', (line) => {
          if (!(line.startsWith('!')) && line.length > 0 && index !== 0) {
            domains.push(line);
          }
          index += 1;
        });
        rl.on('close', () => resolve(domains));
      }
    });
  });
}

module.exports = function pacModule({onStatusChange}) {

  let pacService = new PacService();

  /**
   * start local pac service
   * @param push
   * @param type
   * @param host
   * @param port
   * @param proxyHost
   * @param proxyPort
   * @param customRules
   * @returns {Promise.<void>}
   */
  async function start(push, {type, host, port, proxyHost, proxyPort, customRules}) {
    try {
      // start pac service only in local mode
      if (type === 0) {
        // parse custom rules
        if (Array.isArray(customRules)) {
          customRules = customRules.filter((rule) => rule.length > 0);
        } else {
          customRules = [];
        }
        // parse gfwlist.txt
        const builtInRules = await parseRules(DEFAULT_GFWLIST_PATH);
        pacService.start({host, port, proxyHost, proxyPort, rules: customRules.concat(builtInRules)});
      }
      push(MAIN_START_PAC);
      onStatusChange(true);
    } catch (err) {
      logger.error(err);
    }
  }

  /**
   * stop local pac service
   */
  function stop(push) {
    pacService.stop();
    push(MAIN_STOP_PAC);
    onStatusChange(false);
  }

  return {
    [RENDERER_START_PAC]: start,
    [RENDERER_STOP_PAC]: stop,
  };
};
