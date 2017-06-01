const os = require('os');
const path = require('path');

const HOME_DIR = os.homedir();
const BLINKSOCKS_DIR = path.join(HOME_DIR, '.blinksocks');
const LOG_DIR = path.join(BLINKSOCKS_DIR, 'logs');

module.exports = {
  HOME_DIR,
  BLINKSOCKS_DIR,
  LOG_DIR,
  LOG_FILE_PATH: path.join(LOG_DIR, 'blinksocks-desktop.log'),
  APP_HOME: path.resolve(__dirname, '..', '..'),
  DEFAULT_GFWLIST_PATH: path.join(BLINKSOCKS_DIR, 'gfwlist.txt'),
  DEFAULT_CONFIG_FILE: path.join(BLINKSOCKS_DIR, 'blinksocks.client.js'),
  GFWLIST_URL: 'https://raw.githubusercontent.com/gfwlist/gfwlist/master/gfwlist.txt',
  RELEASES_URL: 'https://github.com/blinksocks/blinksocks-desktop/releases'
};
