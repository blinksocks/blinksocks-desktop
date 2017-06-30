package lib

import (
	"os"
	"path"
)

var HOME_DIR = os.Getenv("HOME")
var BLINKSOCKS_DIR = path.Join(HOME_DIR, ".blinksocks")
var SYSPROXY_PATH = path.Join(BLINKSOCKS_DIR, "proxy_conf_helper")
var SUDO_AGENT_PORT = path.Join(BLINKSOCKS_DIR, ".sudo-agent-port")
