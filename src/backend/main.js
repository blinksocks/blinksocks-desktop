const fs = require('fs');
const path = require('path');
const liburl = require('url');
const {app, shell, BrowserWindow, ipcMain} = require('electron');
const logger = require('./helpers/logger');

const {DEFAULT_CONFIG_STRUCTURE} = require('../defs/bs-config-template');

const {
  MAIN_INIT,
  MAIN_ERROR,
  RENDERER_INIT,
  RENDERER_SAVE_CONFIG,
} = require('../defs/events');

const packageJson = require('../../package.json');

const {createSysProxy} = require('./system/create');

const {
  BLINKSOCKS_DIR,
  DEFAULT_GFWLIST_PATH,
  DEFAULT_CONFIG_FILE
} = require('./constants');

// create .blinksocks directory if not exist
try {
  fs.lstatSync(BLINKSOCKS_DIR);
} catch (err) {
  if (err.code === 'ENOENT') {
    fs.mkdirSync(BLINKSOCKS_DIR);
  }
}

// copy built-in gfwlist.txt if not exist
try {
  fs.lstatSync(DEFAULT_GFWLIST_PATH);
} catch (err) {
  if (err.code === 'ENOENT') {
    const data = fs.readFileSync(path.join(__dirname, 'resources/gfwlist.txt'));
    fs.writeFileSync(DEFAULT_GFWLIST_PATH, data);
  }
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let config;
let sysProxy;

const __PRODUCTION__ =
  (typeof process.env.NODE_ENV === 'undefined') || process.env.NODE_ENV === 'production';

function loadConfig() {
  let json;
  // resolve to absolute path
  const file = DEFAULT_CONFIG_FILE;
  logger.info(`loading configuration from ${file}`);
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
    if (Object.keys(json).length < 1) {
      logger.warn(`empty ${DEFAULT_CONFIG_FILE} detected, use DEFAULT_CONFIG_STRUCTURE instead`);
      json = DEFAULT_CONFIG_STRUCTURE;
    }
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'MODULE_NOT_FOUND') {
      saveConfig(DEFAULT_CONFIG_STRUCTURE);
    }
    logger.warn(`fail to load or parse: ${DEFAULT_CONFIG_FILE}, use DEFAULT_CONFIG_STRUCTURE instead`);
    return DEFAULT_CONFIG_STRUCTURE;
  }
  return json;
}

function saveConfig(json) {
  const data = `module.exports = ${JSON.stringify(json, null, '  ')};`;
  fs.writeFile(DEFAULT_CONFIG_FILE, data, (err) => {
    if (err) {
      logger.error(err);
    }
  });
  logger.info('saving configuration');
}

function onAppClose() {
  // 1. restore all system settings
  if (sysProxy) {
    const restores = [
      sysProxy.restoreGlobal({
        host: config.host,
        port: config.port,
        bypass: config.bypass
      }),
      sysProxy.restorePAC({url: config.pac})
    ];
    Promise.all(restores).then(() => null);

    // shutdown sudo agent if on darwin
    if (process.platform === 'darwin' && typeof sysProxy.killAgent === 'function') {
      sysProxy.killAgent();
    }
    sysProxy = null;
  }
  // 2. save config
  saveConfig(Object.assign({}, config, {app_status: 0, pac_status: 0}));
  // 3. quit app
  app.quit();
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
    win.loadURL(liburl.format({
      pathname: path.join(__dirname, '..', '..', 'build/index.html'),
      protocol: 'file:',
      slashes: true
    }));
  } else {
    win.loadURL(liburl.format({
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

  if (__PRODUCTION__) {
    win.webContents.on('will-navigate', function (e, url) {
      e.preventDefault();
      shell.openExternal(url);
    });
  }

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
app.on('ready', async () => {
  try {
    // 1. initialize then cache
    config = loadConfig();
    sysProxy = await createSysProxy();

    // 2. import & initialize modules
    const ipcHandlers = Object.assign(
      {
        [RENDERER_INIT]: (e) => {
          if (process.platform === 'win32') {
            require('readline').createInterface({
              input: process.stdin,
              output: process.stdout
            }).on('SIGINT', function () {
              process.emit('SIGINT');
            });
          }

          process.on('SIGINT', onAppClose);
          process.on('SIGTERM', onAppClose);
          process.on('uncaughtException', (err) => {
            e.sender.send(MAIN_ERROR, err);
            logger.error(err);
          });

          e.sender.send(MAIN_INIT, {
            version: packageJson.version,
            config,
            pacLastUpdatedAt: fs.lstatSync(DEFAULT_GFWLIST_PATH).mtime.getTime()
          });
        },
        [RENDERER_SAVE_CONFIG]: (e, json) => {
          saveConfig(json);
          config = json; // update cached global.config
        }
      },
      require('./modules/sys')({sysProxy}),
      require('./modules/pac')(),
      require('./modules/bs')(),
      require('./modules/update')()
    );

    Object.keys(ipcHandlers).forEach(
      (eventName) => ipcMain.on(eventName, ipcHandlers[eventName])
    );

    // 3. display window
    createWindow();
  } catch (err) {
    logger.error(err);
    process.exit(-1);
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

app.on('window-all-closed', onAppClose);
