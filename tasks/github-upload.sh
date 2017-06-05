#!/usr/bin/env bash

HELP="$ ./github-upload.sh <tag> <name> <file>"

if [ ! $3 ] ; then
  echo ${HELP}
  exit 1
fi

if command -v github-release > /dev/null; then
  if [[ -z ${GITHUB_TOKEN} ]]; then
    echo "You must set \$GITHUB_TOKEN first"
    exit 1
  fi
  github-release upload --user blinksocks --repo blinksocks-desktop --tag ${1} --name ${2} --file ${3}
else
  echo "You should install github-release first, see https://github.com/aktau/github-release"
fi
