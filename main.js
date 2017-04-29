const {app, shell, BrowserWindow, ipcMain} = require('electron');
const fs = require('fs');
const path = require('path');
const url = require('url');
const {
  MAIN_INIT,
  MAIN_ERROR,
  MAIN_TERMINATE,
  RENDERER_INIT,
  RENDERER_TERMINATE,
  RENDERER_START_BS,
  RENDERER_TERMINATE_BS,
  RENDERER_SAVE_CONFIG,
  RENDERER_SET_SYS_PAC,
  RENDERER_SET_SYS_PROXY,
  RENDERER_SET_SYS_PROXY_BYPASS,
  RENDERER_RESTORE_SYS_PAC,
  RENDERER_RESTORE_SYS_PROXY,
  RENDERER_RESTORE_SYS_PROXY_BYPASS
} = require('./src/events');
const packageJson = require('./package.json');

const {Hub} = require('/Users/Micooz/Projects/blinksocks'); // TODO: change to npm package
const {createSysProxy} = require('./src/system');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let config;
let bs; // blinksocks client
let sysProxy;

const __PRODUCTION__ =
  (typeof process.env.NODE_ENV === 'undefined') || process.env.NODE_ENV === 'production';

const DEFAULT_CONFIG_FILE = './blinksocks.client.js';

function loadConfig() {
  let json;
  // resolve to absolute path
  const file = path.join(process.cwd(), DEFAULT_CONFIG_FILE);
  try {
    const ext = path.extname(file);
    if (ext === '.js') {
      // require .js directly
      delete require.cache[require.resolve(file)];
      json = require(file);
    } else {
      // others are treated as .json
      const jsonFile = fs.readFileSync(file);
      json = JSON.parse(jsonFile);
    }
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'MODULE_NOT_FOUND') {
      saveConfig(DEFAULT_CONFIG_STRUCTURE);
      return DEFAULT_CONFIG_STRUCTURE;
    }
    throw Error(`fail to load/parse your '${DEFAULT_CONFIG_FILE}': ${err}`);
  }
  return json;
}

function saveConfig(json) {
  const file = path.join(process.cwd(), DEFAULT_CONFIG_FILE);
  const data = `module.exports = ${JSON.stringify(json, null, '  ')};`;
  fs.writeFile(file, data, (err) => {
    if (err) {
      console.error(err);
    }
  });
}

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    title: `${packageJson.name} v${packageJson.version}`,
    width: 380,
    height: 620,
    minWidth: 380,
    minHeight: 620
  });

  // and load the index.html of the app.
  if (__PRODUCTION__) {
    win.loadURL(url.format({
      pathname: path.join(__dirname, 'build/index.html'),
      protocol: 'file:',
      slashes: true
    }));
  } else {
    win.loadURL(url.format({
      pathname: 'localhost:3000',
      protocol: 'http:',
      slashes: true
    }));
  }

  // Open the DevTools.
  if (!__PRODUCTION__) {
    win.webContents.openDevTools();
  }

  win.webContents.on('new-window', function (e, url) {
    e.preventDefault();
    shell.openExternal(url);
  });

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  // cache them!
  config = loadConfig();
  sysProxy = createSysProxy();
  // display window
  createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

const ipcHandlers = {
  [RENDERER_INIT]: (e) => {
    const {sender} = e;

    sender.send(MAIN_INIT, {config, services: sysProxy.getServices()});

    process.on('uncaughtException', (err) => {
      sender.send(MAIN_ERROR, err);
      console.error(err);
    });

    process.on('SIGINT', () => {
      sender.send(MAIN_TERMINATE);
    });

    // handle force quit, e,g. Cmd + Q
    app.on('before-quit', () => {
      sender.send(MAIN_TERMINATE);
    });
  },
  [RENDERER_START_BS]: (e, json) => {
    bs = new Hub(json);
    bs.run();
  },
  [RENDERER_TERMINATE_BS]: () => {
    if (bs) {
      bs.terminate();
      bs = null;
    }
  },
  [RENDERER_SAVE_CONFIG]: (e, json) => {
    saveConfig(json);
    config = json; // update cached global.config
  },
  [RENDERER_TERMINATE]: () => {
    process.exit(0);
  },
  [RENDERER_SET_SYS_PAC]: (e, service, {url}) => {
    sysProxy.setPAC(service, url);
    console.info(`set system PAC to: ${url}`);
  },
  [RENDERER_SET_SYS_PROXY]: (e, service, {host, port}) => {
    sysProxy.setSocksProxy(service, host, port);
    sysProxy.setHTTPProxy(service, host, port);
    console.info(`set system proxy(Socks and HTTP) to: ${host}:${port}`);
  },
  [RENDERER_SET_SYS_PROXY_BYPASS]: (e, service, {bypass}) => {
    sysProxy.setBypass(service, config.bypass);
    console.info(`set system bypass to: ${bypass}`);
  },
  [RENDERER_RESTORE_SYS_PAC]: (e, service) => {
    sysProxy.restorePAC(service);
    console.info(`restore system PAC`);
  },
  [RENDERER_RESTORE_SYS_PROXY]: (e, service) => {
    sysProxy.restoreSocksProxy(service);
    sysProxy.restoreHTTPProxy(service);
    console.info(`restore system proxy(Socks and HTTP)`);
  },
  [RENDERER_RESTORE_SYS_PROXY_BYPASS]: (e, service) => {
    sysProxy.restoreByPass(service);
    console.info(`restore system bypass`);
  }
};

Object.keys(ipcHandlers).forEach(
  (eventName) => ipcMain.on(eventName, ipcHandlers[eventName])
);
