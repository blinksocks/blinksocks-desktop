const fs = require('fs');
const zlib = require('zlib');
const logger = require('../helpers/logger');
const existsSync = fs.existsSync;
const chmodSync = fs.chmodSync;

async function lstat(target) {
  return new Promise((resolve, reject) => {
    fs.lstat(target, (err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(stats);
      }
    });
  });
}

async function unzip(from, to) {
  try {
    await lstat(from);

    const gzip = zlib.createUnzip();
    const inp = fs.createReadStream(from);
    const out = fs.createWriteStream(to);
    inp.pipe(gzip).pipe(out);

  } catch (err) {
    logger.error(err);
  }
}

function mkdirSync(dir) {
  try {
    fs.lstatSync(dir);
  } catch (err) {
    if (err.code === 'ENOENT') {
      fs.mkdirSync(dir);
    }
  }
}

function copySync(from, to) {
  if (fs.existsSync(from)) {
    const inp = fs.createReadStream(from);
    const out = fs.createWriteStream(to);
    inp.pipe(out);
  }
}

module.exports = {lstat, unzip, mkdirSync, copySync, existsSync, chmodSync};
