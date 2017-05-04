const child_process = require('child_process');

module.exports.exec = function exec(command, options = {}) {
  return new Promise((resolve, reject) => {
    const opts = Object.assign({
      encoding: 'utf-8'
    }, options);
    console.log(`[shell] executing: ${command}`);
    child_process.exec(command, opts, function (error, stdout, stderr) {
      if (error) {
        reject({code: error.code, stdout, stderr});
      } else {
        resolve({code: 0, stdout, stderr});
      }
    });
  });
};
