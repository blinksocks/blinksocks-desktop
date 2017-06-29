const {unzip, mkdirSync, copySync, existsSync} = require('./helpers/fs');
const {
  BLINKSOCKS_DIR,
  LOG_DIR,
  DEFAULT_GFWLIST_PATH,
  DEFAULT_PROXY_CONF_HELPER_PATH,
  DEFAULT_SUDO_AGENT,
  BUILT_IN_GFWLIST_PATH,
  BUILT_IN_PROXY_CONF_HELPER_PATH,
  BUILT_IN_SUDO_AGENT
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
    copySync(BUILT_IN_PROXY_CONF_HELPER_PATH, DEFAULT_PROXY_CONF_HELPER_PATH, {mode: 0o755});
    unzip(BUILT_IN_SUDO_AGENT, DEFAULT_SUDO_AGENT);
  }
};
