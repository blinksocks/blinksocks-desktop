const fs = require('fs');
const os = require('os');
const path = require('path');
const winston = require('winston');

const HOME_DIR = os.homedir();
const BLINKSOCKS_DIR = path.join(HOME_DIR, '.blinksocks');
const LOG_PATH = path.join(BLINKSOCKS_DIR, 'logs');

try {
  fs.lstatSync(LOG_PATH);
} catch (err) {
  if (err.code === 'ENOENT') {
    fs.mkdirSync(LOG_PATH);
  }
}

module.exports = new (winston.Logger)({
  level: 'silly',
  transports: [
    new (winston.transports.Console)({
      colorize: true,
      prettyPrint: true
    }),
    new (winston.transports.File)({
      filename: path.join(LOG_PATH, 'blinksocks-desktop.log'),
      maxsize: 2 * 1024 * 1024, // 2MB
    })
  ]
});
