#!/usr/bin/env bash

if [ ! $1 ] ; then
  echo "you must specify a file"
  exit 1
fi

sha256sum $1 >> sha256sum.txt
