package main

import (
	"encoding/json"
	"fmt"
	"lib"
	"net"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"io/ioutil"
)

var agent lib.DarwinConf

// udp message structure
type RequestArgs struct {
	Url    string `json:"url"` // for PAC
	Host   string `json:"host"`
	Port   uint16 `json:"port"`
	Bypass string `json:"bypass"`
}
type Message struct {
	Tag    string `json:"tag"`
	Method string `json:"method"`
	Args   RequestArgs `json:"args"`
}

func onInterrupt(conn *net.UDPConn) {
	conn.Close()
	os.Exit(0)
}

func onReceive(msg Message) {
	fmt.Printf("<- %+v\n", msg)

	tag := msg.Tag

	// tag verify
	if tag != os.Args[1] {
		fmt.Printf("unexpected verify tag: \"%v\"\n", tag)
		return
	}

	method := msg.Method
	args := msg.Args

	switch method {
	case "setGlobal":
		agent.SetGlobal(args.Port)
	case "setPAC":
		agent.SetPAC(args.Url)
	case "restoreGlobal":
		agent.RestoreGlobal(args.Port)
	case "restorePAC":
		agent.RestorePAC(args.Url)
	case "kill":
		agent.Kill()
		os.Remove(lib.SUDO_AGENT_PORT)
	}
}

// $ ./sudo-agent <verify_tag>
func main() {
	if len(os.Args) < 2 {
		fmt.Println("invalid args length")
		return
	}

	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)

	// listen unix socket
	conn, err := net.ListenUDP("udp4", nil)
	if err != nil {
		fmt.Println(err)
		return
	}

	// write listen port to fs
	_, port, err := net.SplitHostPort(conn.LocalAddr().String())
	if err != nil {
		fmt.Println(err)
		return
	}
	ioutil.WriteFile(lib.SUDO_AGENT_PORT, []byte(string(port)), 0644)

	go func() {
		<-sigs // handle SIGINT and SIGTERM
		onInterrupt(conn)
	}()

	buffer := make([]byte, 512)
	for {
		// receive
		size, _, err := conn.ReadFrom(buffer)
		if err != nil {
			fmt.Println(err)
			continue
		}

		// to string
		str := string(buffer[0:size])

		// parse json
		var msg Message
		dec := json.NewDecoder(strings.NewReader(str))
		err1 := dec.Decode(&msg)
		if err1 != nil {
			fmt.Printf("cannot parse (\"%v\") due to: %v", str, err1)
			continue
		}
		onReceive(msg)
	}
}
