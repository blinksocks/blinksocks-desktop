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
)

var agent lib.DarwinConf

// udp message structure
type Message struct {
	Tag    string
	Method string
	Args   []string
}

func onInterrupt(conn *net.UnixConn) {
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
		agent.SetGlobal(args[0])
	case "setPAC":
		agent.SetPAC(args[0])
	case "restoreGlobal":
		agent.RestoreGlobal(args[0])
	case "restorePAC":
		agent.RestorePAC(args[0])
	case "kill":
		agent.Kill()
	}
}

// $ ./sudo-agent <verify_tag>
func main() {
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)

	// get unix addr
	addr, err := net.ResolveUDPAddr("udp4", "127.0.0.1:4758")
	if err != nil {
		fmt.Println(err)
		return
	}

	// listen unix socket
	conn, err := net.ListenUDP("udp4", addr)
	if err != nil {
		fmt.Println(err)
		return
	}

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
		fmt.Printf("%v bytes recieved: %v\n", size, str)

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
