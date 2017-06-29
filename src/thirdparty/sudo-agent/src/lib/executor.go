package lib

import (
	"fmt"
	"os/exec"
	"os"
	"path"
)

var HOME_DIR = os.Getenv("HOME")
var BLINKSOCKS_DIR = path.Join(HOME_DIR, ".blinksocks")
var SYSPROXY_PATH = path.Join(BLINKSOCKS_DIR, "proxy_conf_helper")

type DarwinConf struct {
}

func Exec(command string) {
	_, err := exec.Command(command).Output()
	if err != nil {
		fmt.Println(err)
	}
}

func (*DarwinConf) SetGlobal(port string) {
	Exec(fmt.Sprintf("%v --mode global --port %v", SYSPROXY_PATH, port))
}

func (*DarwinConf) SetPAC(url string) {
	Exec(fmt.Sprintf("%v --mode auto --pac-url %v", SYSPROXY_PATH, url))
}

func (*DarwinConf) RestoreGlobal(port string) {
	Exec(fmt.Sprintf("%v --mode off --port %v", SYSPROXY_PATH, port))
}

func (*DarwinConf) RestorePAC(url string) {
	Exec(fmt.Sprintf("%v --mode off --pac-url %v", SYSPROXY_PATH, url))
}

func (*DarwinConf) Kill() {
	process, err := os.FindProcess(os.Getpid())
	if err != nil {
		process.Kill()
	} else {
		os.Exit(0)
	}
}
