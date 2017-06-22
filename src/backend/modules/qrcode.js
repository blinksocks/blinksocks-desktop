const QRCode = require('qrcode');
const {clipboard, nativeImage} = require('electron');

const {
  MAIN_ERROR,
  MAIN_CREATE_QR_CODE,
  MAIN_COPY_QR_CODE_AS_IMAGE,
  MAIN_COPY_QR_CODE_AS_TEXT,
  RENDERER_CREATE_QR_CODE,
  RENDERER_COPY_QR_CODE_AS_IMAGE,
  RENDERER_COPY_QR_CODE_AS_TEXT
} = require('../../defs/events');

/**
 * A promise wrapper to QRCode.toDataURL
 * @param qrcode
 * @returns {Promise}
 * @constructor
 */
function QRCodeToDataURL(qrcode) {
  return new Promise((resolve, reject) => {
    QRCode.toDataURL(qrcode.instance.segments, (err, url) => {
      if (err) {
        reject(err);
      } else {
        resolve(url);
      }
    });
  });
}

module.exports = function qrcodeModule() {
  const qrcodes = {
    // [name]: {rawText, instance: <QRCode object>}
  };

  async function create(push, {name, message}) {
    try {
      qrcodes[name] = {
        rawText: message,
        instance: QRCode.create(message)
      };
      push(MAIN_CREATE_QR_CODE, {name, dataURL: await QRCodeToDataURL(qrcodes[name])});
    } catch (err) {
      push(MAIN_ERROR, err.message);
    }
  }

  async function copyAsImage(push, {name}) {
    if (typeof qrcodes[name] !== 'undefined') {
      try {
        const dataURL = await QRCodeToDataURL(qrcodes[name]);
        const image = nativeImage.createFromDataURL(dataURL);
        clipboard.writeImage(image);
        push(MAIN_COPY_QR_CODE_AS_IMAGE);
      } catch (err) {
        push(MAIN_ERROR, err.message);
      }
    }
  }

  async function copyAsText(push, {name}) {
    if (typeof qrcodes[name] !== 'undefined') {
      try {
        const {rawText} = qrcodes[name];
        clipboard.writeText(rawText);
        push(MAIN_COPY_QR_CODE_AS_TEXT);
      } catch (err) {
        push(MAIN_ERROR, err.message);
      }
    }
  }

  return {
    [RENDERER_CREATE_QR_CODE]: create,
    [RENDERER_COPY_QR_CODE_AS_IMAGE]: copyAsImage,
    [RENDERER_COPY_QR_CODE_AS_TEXT]: copyAsText
  };
};
