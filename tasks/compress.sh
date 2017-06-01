#!/usr/bin/env bash

if [ ! $1 ] ; then
  echo "you must specify an input path"
  exit 1
fi

if [ ! $2 ] ; then
  echo "you must specify an output path"
  exit 1
fi

tar -zcf $2 $1
