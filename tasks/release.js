#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const packager = require('electron-packager');
const packageJson = require('../package.json');

const name = packageJson.name;
const version = packageJson.version;
const root = path.join.bind(path, path.resolve(__dirname, '..'));

const options = {
  dir: root(),
  out: root('releases'),
  appVersion: version,
  name: name,
  appCopyright: 'Copyright 2017 blinksocks',
  platform: 'linux,win32,darwin',
  arch: 'ia32,x64',
  asar: true,
  packageManager: 'npm',
  overwrite: true,
  prune: true,
  quiet: false,
  win32metadata: {
    CompanyName: '',
    FileDescription: 'Cross-platform desktop GUI for blinksocks',
    OriginalFilename: name,
    ProductName: name,
    InternalName: name
  },
  // If the file extension is omitted, it is auto-completed to the correct extension based on the platform
  // https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#icon
  icon: path.resolve(__dirname, 'icon')
};

const execFileSync = function (sh, args = []) {
  if (typeof sh === 'string') {
    child_process.execFileSync(sh, args, {cwd: root('releases')});
  }
};

packager(options, function done(err, appPaths) {
  if (err) {
    console.error(err);
  } else {
    let isPatchGenerated = false;
    for (const dir of appPaths) {
      const newDir = `${dir}-v${version}`;
      try {
        // 1. append version
        fs.renameSync(dir, newDir);

        // 2. generate patch
        if (!isPatchGenerated) {
          let appAsar;
          if (newDir.indexOf('darwin') !== -1) {
            appAsar = path.join(newDir, `${name}.app`, 'Contents', 'Resources', 'app.asar');
          } else {
            appAsar = path.join(newDir, 'resources', 'app.asar');
          }
          execFileSync(root('tasks', 'create-patch.sh'), [appAsar, `${name}-v${version}.patch`]);
          isPatchGenerated = true;
        }

        // 3. compress into .tar.gz
        execFileSync(root('tasks', 'compress.sh'), [path.basename(newDir), `${newDir}.tar.gz`]);

        // 4. generate sha256sum.txt
        execFileSync(root('tasks', 'sha256sum.sh'), [`${path.basename(newDir)}.tar.gz`]);
      } catch (err) {
        console.error(err);
        process.exit(1);
      }
    }
  }
});
