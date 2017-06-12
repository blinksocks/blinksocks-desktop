const crypto = require('crypto');
const path = require('path');
const zlib = require('zlib');
const fs = require('original-fs');
const axios = require('axios');
const isProduction = !require('electron-is-dev');
const logger = require('../helpers/logger');

const {
  GFWLIST_URL,
  RELEASES_URL,
  DEFAULT_GFWLIST_PATH
} = require('../constants');

const {
  MAIN_UPDATE_PAC,
  MAIN_UPDATE_PAC_FAIL,
  MAIN_UPDATE_SELF,
  MAIN_UPDATE_SELF_PROGRESS,
  MAIN_UPDATE_SELF_FAIL,
  RENDERER_UPDATE_PAC,
  RENDERER_UPDATE_SELF,
  RENDERER_UPDATE_SELF_CANCEL
} = require('../../defs/events');

function checkPatchHash(patchBuf) {
  if (patchBuf.length < 32) {
    throw Error('patch is too short');
  }
  const hashHead = patchBuf.slice(0, 32);
  const sha256 = crypto.createHash('sha256');
  const restBuf = patchBuf.slice(32);
  const realHashHead = sha256.update(restBuf).digest();
  if (!hashHead.equals(realHashHead)) {
    throw Error(`sha256 mismatch, expect ${hashHead.toString('hex')} but got ${realHashHead.toString('hex')}`);
  }
}

module.exports = function updateModule({app}) {

  let updateSelfRequest = null;

  /**
   * update pac
   * @param e
   * @returns {Promise.<void>}
   */
  async function updatePac(e) {
    const stat = fs.lstatSync(DEFAULT_GFWLIST_PATH);
    const lastModifiedAt = stat.mtime.getTime();
    const now = (new Date()).getTime();
    if (now - lastModifiedAt >= 6 * 60 * 60 * 1e3) { // 6 hours
      try {
        logger.info(`updating pac from: ${GFWLIST_URL}`);
        const response = await axios({
          method: 'get',
          url: GFWLIST_URL,
          responseType: 'stream'
        });
        response.data.pipe(fs.createWriteStream(DEFAULT_GFWLIST_PATH));
        logger.info(`pac updated successfully`);
        e.sender.send(MAIN_UPDATE_PAC, now);
      } catch (err) {
        logger.error(err);
        e.sender.send(MAIN_UPDATE_PAC_FAIL, err.message);
      }
    } else {
      const message = 'pac had been updated less than 6 hours';
      logger.warn(message);
      e.sender.send(MAIN_UPDATE_PAC_FAIL, message);
    }
  }

  /**
   * preform self-update
   * @param e
   * @param version
   * @returns {Promise.<void>}
   */
  async function updateSelf(e, {version}) {
    const patchName = `blinksocks-desktop-v${version}`;
    const patchUrl = `${RELEASES_URL}/download/v${version}/${patchName}.patch.gz`;

    try {
      logger.info(`downloading patch file: ${patchUrl}`);

      // 1. download patch file
      updateSelfRequest = axios.CancelToken.source();
      const response = await axios({
        method: 'get',
        url: patchUrl,
        responseType: 'stream',
        cancelToken: updateSelfRequest.token
      });
      const stream = response.data;
      const contentLength = +stream.headers['content-length'];

      let buffer = Buffer.alloc(0);
      stream.on('data', (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
        e.sender.send(MAIN_UPDATE_SELF_PROGRESS, {
          totalBytes: contentLength,
          receivedBytes: buffer.length,
          percentage: contentLength > 0 ? buffer.length / contentLength : 0
        });
      });
      stream.on('end', () => {
        logger.info(`downloaded patch file, size=${buffer.length} bytes`);
        try {
          // 2. unzip
          buffer = zlib.unzipSync(buffer);

          // 3. check hash
          if (!checkPatchHash(buffer)) {
            return;
          }

          // 4. overwrite the current asar
          if (isProduction) {
            const asarBuf = buffer.slice(32);

            let appAsarPath;
            if (process.platform === 'darwin') {
              appAsarPath = path.resolve(path.dirname(process.execPath), '../Resources/app.asar');
            } else {
              appAsarPath = path.resolve(path.dirname(process.execPath), 'resources', 'app.asar');
            }
            fs.createReadStream(asarBuf).pipe(fs.createWriteStream(appAsarPath));
            logger.info(`overwrite ${appAsarPath}`);
          } else {
            logger.warn('app.asar will not be replaced in development');
          }

          // 5. restart app
          if (isProduction) {
            app.relaunch();
            app.exit(0);
          } else {
            logger.warn('app will not restart in development');
          }

          e.sender.send(MAIN_UPDATE_SELF);
        } catch (err) {
          logger.error(err.message);
          e.sender.send(MAIN_UPDATE_SELF_FAIL, err.message);
        }
      });
    } catch (err) {
      logger.error(err.message);
      e.sender.send(MAIN_UPDATE_SELF_FAIL, err.message);
    }
  }

  /**
   * cancel self-updating
   */
  function cancelUpdateSelf() {
    if (updateSelfRequest !== null) {
      updateSelfRequest.cancel('Updating Canceled');
      updateSelfRequest = null;
      logger.info('self updating canceled');
    }
  }

  return {
    [RENDERER_UPDATE_PAC]: updatePac,
    [RENDERER_UPDATE_SELF]: updateSelf,
    [RENDERER_UPDATE_SELF_CANCEL]: cancelUpdateSelf
  };
};
