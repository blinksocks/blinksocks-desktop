const os = require('os');
const path = require('path');
const url = require('url');
const isProduction = !require('electron-is-dev');

const DEV_ADDRESS = 'http://localhost:3000';
const APP_ICON = path.resolve(__dirname, 'resources', 'icon.png');
const APP_TRAY_ICON = path.resolve(__dirname, 'resources', {
  'win32': 'tray-icon.ico',
  'darwin': 'tray-icon.png',
  'linux': 'tray-icon.png'
}[process.platform]);
const APP_HOME = path.resolve(__dirname, '..', '..');
const HOME_DIR = os.homedir();
const BLINKSOCKS_DIR = path.join(HOME_DIR, '.blinksocks');
const LOG_DIR = path.join(BLINKSOCKS_DIR, 'logs');
const LOG_FILE_PATH = path.join(LOG_DIR, 'blinksocks-desktop.log');
const DEFAULT_GFWLIST_PATH = path.join(BLINKSOCKS_DIR, 'gfwlist.txt');
const DEFAULT_CONFIG_FILE = path.join(BLINKSOCKS_DIR, 'blinksocks.client.js');

const APP_MAIN_URL = isProduction ?
  `file://${path.join(__dirname, '..', '..', 'build/index.html')}#/main` :
  `${DEV_ADDRESS}/#/main`;

const APP_LOG_URL = isProduction ?
  `file://${path.join(__dirname, '..', '..', 'build/index.html')}#/logs` :
  `${DEV_ADDRESS}/#/logs`;

module.exports = {
  HOME_DIR,
  BLINKSOCKS_DIR,
  LOG_DIR,
  LOG_FILE_PATH,
  APP_ICON,
  APP_TRAY_ICON,
  APP_HOME,
  APP_MAIN_URL,
  APP_LOG_URL,
  DEFAULT_GFWLIST_PATH,
  DEFAULT_CONFIG_FILE,
  GFWLIST_URL: 'https://raw.githubusercontent.com/gfwlist/gfwlist/master/gfwlist.txt',
  RELEASES_URL: 'https://github.com/blinksocks/blinksocks-desktop/releases'
};
