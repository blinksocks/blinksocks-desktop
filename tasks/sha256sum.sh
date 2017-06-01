#!/usr/bin/env bash

command -v openssl > /dev/null 2>&1

if [ $? != 0 ]; then
  echo "openssl is required to be installed"
  exit 1
fi

if [ ! $1 ] ; then
  echo "you must specify a file as the second parameter"
  exit 1
fi

openssl dgst -sha256 -hex $1 >> sha256sum.txt
