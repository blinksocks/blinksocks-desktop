const crypto = require('crypto');
const path = require('path');
const fs = require('original-fs');
const axios = require('axios');
const logger = require('../helpers/logger');

const {
  BLINKSOCKS_DIR,
  GFWLIST_URL,
  RELEASES_URL,
  DEFAULT_GFWLIST_PATH
} = require('../constants');

const {
  MAIN_UPDATE_PAC,
  MAIN_UPDATE_SELF,
  MAIN_UPDATE_SELF_PROGRESS,
  MAIN_UPDATE_SELF_FAIL,
  RENDERER_UPDATE_PAC,
  RENDERER_UPDATE_SELF,
  RENDERER_UPDATE_SELF_CANCEL
} = require('../../defs/events');

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
        const response = await axios({
          method: 'get',
          url: GFWLIST_URL,
          responseType: 'stream'
        });
        response.data.pipe(fs.createWriteStream(DEFAULT_GFWLIST_PATH));
        logger.info(`updated pac from ${GFWLIST_URL}`);
        e.sender.send(MAIN_UPDATE_PAC, now);
      } catch (err) {
        logger.error(err);
      }
    } else {
      logger.warn('pac had been updated less than 6 hours');
      e.sender.send(MAIN_UPDATE_PAC, lastModifiedAt);
    }
  }

  /**
   * preform self-update
   * @param e
   * @param version
   * @returns {Promise.<void>}
   */
  async function updateSelf(e, {version}) {
    const {platform, arch} = process;
    const patchName = `blinksocks-desktop-${platform}-${arch}-v${version}`;
    const patchUrl = `${RELEASES_URL}/download/${version}/${patchName}.patch`;

    const fail = (msg) => {
      logger.error(msg);
      e.sender.send(MAIN_UPDATE_SELF_FAIL, msg);
    };

    try {
      logger.info(`downloading patch file ${patchUrl}`);

      // 1. download patch file
      updateSelfRequest = axios.CancelToken.source();
      const response = await axios({
        method: 'get',
        url: patchUrl,
        onDownloadProgress: (progressEvent) => {
          e.sender.send(MAIN_UPDATE_SELF_PROGRESS, {progressEvent});
        },
        responseType: 'stream',
        cancelToken: updateSelfRequest.token
      });
      const stream = response.data;

      // 2. get the first 256-bit as sha256
      let buffer = Buffer.alloc(0);

      stream.on('data', (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
      });

      stream.on('end', () => {
        const expSha256Buf = buffer.slice(0, 32);

        if (expSha256Buf.length !== 32) {
          return fail('cannot read sha256 header');
        }

        logger.info(`downloaded patch file with sha256=${expSha256Buf.toString('hex')}`);

        // 3. check hash
        const sha256 = crypto.createHash('sha256');
        const asarBuf = buffer.slice(32);
        const realSha256Buf = sha256.update(asarBuf).digest();

        if (!expSha256Buf.equals(realSha256Buf)) {
          return fail(`sha256 mismatch, expect ${expSha256Buf.toString('hex')} but got ${realSha256Buf.toString('hex')}`);
        }
        logger.info('sha256 is correct');

        // 4. write remaining data
        const savePath = path.join(BLINKSOCKS_DIR, `${patchName}.asar`);
        fs.writeFileSync(savePath, asarBuf);
        logger.info(`saved ${savePath}.asar`);

        // 5. replace the current asar
        let appAsar;
        if (process.platform === 'darwin') {
          appAsar = path.resolve(path.dirname(process.execPath), 'blinksocks-desktop.app', 'Contents', 'Resources', 'app.asar');
        } else {
          appAsar = path.resolve(path.dirname(process.execPath), 'resources', 'app.asar');
        }
        fs.createReadStream(savePath).pipe(fs.createWriteStream(appAsar));

        // 6. restart app
        app.relaunch();
        app.exit(0);

        e.sender.send(MAIN_UPDATE_SELF);
      });
    } catch (err) {
      return fail(err.message);
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
