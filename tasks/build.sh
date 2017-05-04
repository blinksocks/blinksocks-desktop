#!/usr/bin/env bash

electron-packager ./backend blinksocks-desktop \
  --platform="win32" --arch="x64" \
  --app-copyright="Copyright 2017 blinksocks" \
  --app-version="0.0.1" \
  --asar \
  --icon="packaging/icon.png" \
  --electron-version="1.6.8" \
  --overwrite \
  --win32metadata.CompanyName="" \
  --win32metadata.FileDescription="Cross-platform desktop GUI for blinksocks" \
  --win32metadata.OriginalFilename="blinksocks-desktop" \
  --win32metadata.ProductName="blinksocks-desktop" \
  --win32metadata.InternalName="" \
  --win32metadata.requestedExecutionLevel="user"
