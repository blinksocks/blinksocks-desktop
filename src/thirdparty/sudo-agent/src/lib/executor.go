package lib

import (
	"fmt"
	"os/exec"
	"os"
	"strings"
)

type DarwinConf struct {
}

func Exec(args string) {
	fmt.Printf("%v %v", SYSPROXY_PATH, args)
	_, err := exec.Command(SYSPROXY_PATH, strings.Split(args, " ")...).Output()
	if err != nil {
		fmt.Println(err)
	}
}

func (*DarwinConf) SetGlobal(port uint16) {
	Exec(fmt.Sprintf("--mode global --port %v", port))
}

func (*DarwinConf) SetPAC(url string) {
	Exec(fmt.Sprintf("--mode auto --pac-url %v", url))
}

func (*DarwinConf) RestoreGlobal(port uint16) {
	Exec(fmt.Sprintf("--mode off --port %v", port))
}

func (*DarwinConf) RestorePAC(url string) {
	Exec(fmt.Sprintf("--mode off --pac-url %v", url))
}

func (*DarwinConf) Kill() {
	process, err := os.FindProcess(os.Getpid())
	if err != nil {
		process.Kill()
	} else {
		os.Exit(0)
	}
}
