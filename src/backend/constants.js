const os = require('os');
const path = require('path');
const url = require('url');
const isProduction = !require('electron-is-dev');

// development
const DEV_ADDRESS = 'http://localhost:3000';

const APP_HOME = path.resolve(__dirname, '..', '..');
const HOME_DIR = os.homedir();

const APP_ICON = path.join(APP_HOME, 'resources', 'icon.png');
const APP_TRAY_ICON = path.join(APP_HOME, 'resources', {
  'win32': 'tray-icon.ico',
  'darwin': 'tray-icon.png',
  'linux': 'tray-icon.png'
}[process.platform]);

const BLINKSOCKS_DIR = path.join(HOME_DIR, '.blinksocks');
const LOG_DIR = path.join(BLINKSOCKS_DIR, 'logs');
const LOG_FILE_PATH = path.join(LOG_DIR, 'blinksocks-desktop.log');
const DEFAULT_GFWLIST_PATH = path.join(BLINKSOCKS_DIR, 'gfwlist.txt');
const DEFAULT_CONFIG_FILE = path.join(BLINKSOCKS_DIR, 'blinksocks.client.js');
const BUILT_IN_GFWLIST_PATH = path.join(APP_HOME, 'resources', 'gfwlist.txt');
const BUILT_IN_ADP_SCRIPTS_PATH = path.join(APP_HOME, 'resources', 'adp-scripts.js');

// darwin
const DARWIN_BUILT_IN_SUDO_AGENT_GZ_PATH = path.join(APP_HOME, 'resources', 'sudo-agent_darwin_x64.gz');
const DARWIN_SUDO_AGENT_PATH = path.join(BLINKSOCKS_DIR, 'sudo-agent');
const DARWIN_SUDO_AGENT_PORT_FILE = path.join(BLINKSOCKS_DIR, '.sudo-agent-port');
const DARWIN_BUILT_IN_SYSPROXY_GZ_PATH = path.join(APP_HOME, 'resources', 'proxy_conf_helper.gz');
const DARWIN_SYSPROXY_HELPER = path.join(BLINKSOCKS_DIR, 'proxy_conf_helper');

// win32
const WIN32_BUILT_IN_SYSPROXY_GZ_PATH = {
  'ia32': path.join(APP_HOME, 'resources', 'sysproxy.exe.gz'),
  'x64': path.join(APP_HOME, 'resources', 'sysproxy64.exe.gz')
}[process.arch];

const WIN32_SYSPROXY_HELPER = {
  'ia32': path.join(BLINKSOCKS_DIR, 'sysproxy.exe'),
  'x64': path.join(BLINKSOCKS_DIR, 'sysproxy64.exe')
}[process.arch];

// app

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
  BUILT_IN_GFWLIST_PATH,
  BUILT_IN_ADP_SCRIPTS_PATH,
  DARWIN_BUILT_IN_SUDO_AGENT_GZ_PATH,
  DARWIN_SUDO_AGENT_PATH,
  DARWIN_SUDO_AGENT_PORT_FILE,
  DARWIN_SYSPROXY_HELPER,
  DARWIN_BUILT_IN_SYSPROXY_GZ_PATH,
  WIN32_BUILT_IN_SYSPROXY_GZ_PATH,
  WIN32_SYSPROXY_HELPER,
  GFWLIST_URL: 'https://raw.githubusercontent.com/gfwlist/gfwlist/master/gfwlist.txt',
  RELEASES_URL: 'https://github.com/blinksocks/blinksocks-desktop/releases'
};
