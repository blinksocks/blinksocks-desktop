#!/usr/bin/env bash

function build_sudo_agent() {
  command -v go > /dev/null 2>&1

  if [ $? != 0 ]; then
    echo "go is required to be installed"
    exit 1
  fi

  # GOPATH
  DIR=`pwd`/src/thirdparty/sudo-agent
  export GOPATH=${DIR}

  # build for darwin
  ENTRY_FILE=./src/thirdparty/sudo-agent/src
  OUT_PATH=./src/backend/resources/sudo-agent_darwin_x64
  GOOS=darwin GOARCH=amd64 go build -ldflags "-w" -o ${OUT_PATH} ${ENTRY_FILE}

  # gzip
  if [ $? == 0 ]; then
    gzip ${OUT_PATH}
  fi
}

build_sudo_agent
