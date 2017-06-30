const {unzip, mkdirSync, copySync, existsSync, chmodSync} = require('./helpers/fs');
const {
  BLINKSOCKS_DIR,
  LOG_DIR,
  DEFAULT_GFWLIST_PATH,
  BUILT_IN_GFWLIST_PATH,
  DARWIN_BUILT_IN_SYSPROXY_GZ_PATH,
  DARWIN_SYSPROXY_HELPER,
  DARWIN_BUILT_IN_SUDO_AGENT_GZ_PATH,
  DARWIN_SUDO_AGENT_PATH,
  WIN32_SYSPROXY_HELPER,
  WIN32_BUILT_IN_SYSPROXY_GZ_PATH
} = require('./constants');

module.exports = function init() {
  // create ~/.blinksocks directory if not exist
  mkdirSync(BLINKSOCKS_DIR);

  // create ~/.blinksocks/logs if not exist
  mkdirSync(LOG_DIR);

  // create ~/.blinksocks/gfwlist.txt if not exist
  if (!existsSync(DEFAULT_GFWLIST_PATH)) {
    copySync(BUILT_IN_GFWLIST_PATH, DEFAULT_GFWLIST_PATH);
  }

  // overwrite ~/proxy_conf_helper and ~/sudo-agent_darwin_x64 for macOS
  if (process.platform === 'darwin') {
    unzip(DARWIN_BUILT_IN_SYSPROXY_GZ_PATH, DARWIN_SYSPROXY_HELPER);
    unzip(DARWIN_BUILT_IN_SUDO_AGENT_GZ_PATH, DARWIN_SUDO_AGENT_PATH);
    chmodSync(DARWIN_SYSPROXY_HELPER, 0o755);
    chmodSync(DARWIN_SUDO_AGENT_PATH, 0o755);
  }

  // overwrite ~/sysproxy(64).exe for Windows
  if (process.platform === 'win32') {
    unzip(WIN32_BUILT_IN_SYSPROXY_GZ_PATH, WIN32_SYSPROXY_HELPER);
    chmodSync(WIN32_SYSPROXY_HELPER, 0o755);
  }
};
