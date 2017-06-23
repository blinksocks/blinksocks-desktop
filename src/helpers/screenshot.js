const {desktopCapturer, screen} = window.require('electron');

/**
 * get current display size
 * @returns {{width: number, height: number}}
 */
function getScreenSize() {
  // const displays = screen.getAllDisplays();
  const displays = [screen.getPrimaryDisplay()];
  const size = {
    width: 0,
    height: 0
  };
  for (const display of displays) {
    const {width, height} = display.size;
    size.width += width;
    size.height += height;
  }
  return size;
}

/**
 * a promise wrapper to desktopCapturer.getSources of electron
 * @returns {Promise}
 */
function getSources() {
  return new Promise((resolve, reject) => {
    desktopCapturer.getSources({types: ['window', 'screen']}, (error, sources) => {
      if (error) {
        reject(error);
      } else {
        resolve(sources);
      }
    });
  });
}

export async function takeScreenShot() {
  const sources = await getSources();
  const source = sources.find((src) => src.name === 'Entire screen'); // Entire screen

  if (!source) {
    throw Error('Couldn\'t find "Entire screen"');
  }

  const {width, height} = getScreenSize();
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source.id,
        minWidth: width,
        maxWidth: width,
        minHeight: height,
        maxHeight: height
      }
    }
  });

  const video = document.createElement('video');
  const canvas = document.createElement('canvas');

  return new Promise((resolve) => {
    video.src = URL.createObjectURL(stream);
    video.addEventListener('loadedmetadata', () => {
      const ratio = video.videoWidth / video.videoHeight;
      const w = video.videoWidth;
      const h = parseInt(w / ratio, 10);

      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, w, h);

      resolve(ctx.getImageData(0, 0, w, h));
    }, false);
  });
}
