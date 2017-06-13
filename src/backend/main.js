const fs = require('fs');
const path = require('path');
const {app, shell, BrowserWindow, ipcMain, Tray, Menu} = require('electron');
const isProduction = !require('electron-is-dev');
const bsLogger = require('blinksocks').logger;

require('./init');

const logger = require('./helpers/logger');
const {DEFAULT_CONFIG_STRUCTURE} = require('../defs/bs-config-template');

const {
  MAIN_INIT,
  MAIN_ERROR,
  RENDERER_INIT,
  RENDERER_START_BS,
  RENDERER_STOP_BS,
  RENDERER_START_PAC,
  RENDERER_STOP_PAC,
  RENDERER_SET_SYS_PROXY,
  RENDERER_SET_SYS_PAC,
  RENDERER_RESTORE_SYS_PROXY,
  RENDERER_RESTORE_SYS_PAC,
  RENDERER_SAVE_CONFIG,
  RENDERER_PREVIEW_LOGS
} = require('../defs/events');

const packageJson = require('../../package.json');

const {createSysProxy} = require('./system/create');

const {
  APP_ICON,
  APP_TRAY_ICON,
  APP_MAIN_URL,
  APP_LOG_URL,
  DEFAULT_GFWLIST_PATH,
  DEFAULT_CONFIG_FILE
} = require('./constants');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;
let logWindow = null;
let tray = null;
let config;
let sysProxy;
let directModuleCall = null;

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
  app.exit(0);
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    title: `${packageJson.name} v${packageJson.version}`,
    icon: APP_ICON,
    width: 380,
    height: 620,
    minWidth: 380,
    minHeight: 620,
    show: false
  });

  // and load the index.html of the app.
  mainWindow.loadURL(APP_MAIN_URL);

  // Open the DevTools.
  if (!isProduction && process.argv[2] === '--devtools') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.webContents.on('new-window', function (e, url) {
    e.preventDefault();
    shell.openExternal(url);
  });

  if (isProduction) {
    mainWindow.webContents.on('will-navigate', function (e, url) {
      e.preventDefault();
      shell.openExternal(url);
    });
  }

  mainWindow.on('ready-to-show', () => mainWindow.show());

  mainWindow.on('close', (e) => {
    if (tray !== null) {
      // balloon only available on Windows
      // https://electron.atom.io/docs/api/tray/#traydisplayballoonoptions-windows
      tray.displayBalloon({
        title: 'blinksocks-desktop',
        content: 'blinksocks-desktop is running at background'
      });
    }
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
    if (logWindow !== null) {
      logWindow.close();
    }
  });
}

function registerIPC(handlers) {
  const events = Object.keys(handlers);
  for (const event of events) {
    ipcMain.on(event, (e, ...args) => {
      // an wrapper for e.sender.send
      const push = (name, ...args2) => {
        try {
          e.sender.send(name, ...args2);
        } catch (err) {
          // just ignore any errors
        }
      };
      handlers[event](push, ...args);
    });
  }
}

/**
 * initialize module ipc
 */
function rendererReady({push}) {
  const moduleHandlers = Object.assign(
    {},
    require('./modules/sys')({sysProxy}),
    require('./modules/bs')({
      onStatusChange: (isRunning) => updateContextMenu({
        id: TRAY_MENU_ITEM_APP,
        props: {
          label: `App Status: ${isRunning ? 'On' : 'Off'}`
        }
      })
    }),
    require('./modules/pac')({
      onStatusChange: (isRunning) => updateContextMenu({
        id: TRAY_MENU_ITEM_PAC,
        props: {
          label: `PAC Status: ${isRunning ? 'On' : 'Off'}`
        }
      })
    }),
    require('./modules/update')({app}),
    require('./modules/log')({bsLogger: bsLogger, bsdLogger: logger})
  );
  // create directModuleCall method, so that we can call ipcHandlers directly
  directModuleCall = (name, ...args) => moduleHandlers[name](push, ...args);
  registerIPC(moduleHandlers);
}

// menu stuff

const TRAY_MENU_ITEM_SHOW_APPLICATION = 0;
const TRAY_MENU_ITEM_SEPARATOR_1 = 1;
const TRAY_MENU_ITEM_APP = 2;
const TRAY_MENU_ITEM_PAC = 3;
const TRAY_MENU_ITEM_SEPARATOR_2 = 4;
const TRAY_MENU_ITEM_QUIT = 5;

let menuItems = {
  [TRAY_MENU_ITEM_SHOW_APPLICATION]: {
    type: 'normal',
    label: 'Open Application',
    click: onMenuItemShowApplication
  },
  [TRAY_MENU_ITEM_SEPARATOR_1]: {
    type: 'separator'
  },
  [TRAY_MENU_ITEM_APP]: {
    type: 'normal',
    label: 'App Status: Off',
    sublabel: 'blinksocks client',
    click: onMenuItemToggleAppService
  },
  [TRAY_MENU_ITEM_PAC]: {
    type: 'normal',
    label: 'PAC Status: Off',
    sublabel: 'proxy auto configure service',
    click: onMenuItemTogglePacService
  },
  [TRAY_MENU_ITEM_SEPARATOR_2]: {
    type: 'separator'
  },
  [TRAY_MENU_ITEM_QUIT]: {
    type: 'normal',
    label: 'Quit',
    click: onAppClose
  }
};

function onMenuItemShowApplication() {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
}

function onMenuItemToggleAppService() {
  const {app_status, pac_status} = config;
  const {host, port, bypass, pac} = config;
  if (app_status === 0) {
    directModuleCall(RENDERER_START_BS, {config});
    if (pac_status === 0) {
      directModuleCall(RENDERER_SET_SYS_PROXY, {host, port, bypass});
    } else {
      directModuleCall(RENDERER_SET_SYS_PAC, {url: pac});
    }
    config.app_status = 1;
    saveConfig(config);
  } else {
    directModuleCall(RENDERER_STOP_BS);
    directModuleCall(RENDERER_RESTORE_SYS_PROXY, {host, port, bypass});
    directModuleCall(RENDERER_RESTORE_SYS_PAC, {url: pac});
    config.app_status = 0;
    saveConfig(config);
  }
}

function onMenuItemTogglePacService() {
  const {app_status, pac_status} = config;
  const {host, port, bypass, pac} = config;
  if (pac_status === 0) {
    directModuleCall(RENDERER_START_PAC, {
      url: config.pac,
      proxyHost: config.host,
      proxyPort: config.port
    });
    if (app_status === 1) {
      directModuleCall(RENDERER_SET_SYS_PAC, {url: pac});
    }
    config.pac_status = 1;
    saveConfig(config);
  } else {
    directModuleCall(RENDERER_STOP_PAC);
    if (app_status === 1) {
      directModuleCall(RENDERER_SET_SYS_PROXY, {host, port, bypass});
    }
    config.pac_status = 0;
    saveConfig(config);
  }
}

function updateContextMenu(updates = [/* {id, props}, ... */]) {
  if (tray !== null) {
    updates = Array.isArray(updates) ? updates : [updates];
    for (const {id, props} of updates) {
      if (typeof menuItems[id] !== 'undefined') {
        Object.assign(menuItems[id], props);
      }
    }
    tray.setContextMenu(Menu.buildFromTemplate(Object.values(menuItems)));
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  try {
    // 1. initialize then cache
    config = loadConfig();
    sysProxy = await createSysProxy();

    // 2. initialize non-module ipc
    registerIPC({
      [RENDERER_INIT]: (push) => {
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
          try {
            push(MAIN_ERROR, err);
          } catch (err) {
            // fallthrough
          }
          logger.error(err);
        });
        push(MAIN_INIT, {
          version: packageJson.version,
          config,
          pacLastUpdatedAt: fs.lstatSync(DEFAULT_GFWLIST_PATH).mtime.getTime()
        });
        rendererReady({push});
      },
      [RENDERER_SAVE_CONFIG]: (push, json) => {
        saveConfig(json);
        config = json; // update cached global.config
      },
      [RENDERER_PREVIEW_LOGS]: () => {
        if (logWindow !== null) {
          logWindow.focus();
        } else {
          logWindow = new BrowserWindow({
            title: `${packageJson.name} - logs`,
            width: 800,
            height: 600,
            show: false
          });
          logWindow.on('closed', () => logWindow = null);
          logWindow.on('ready-to-show', () => logWindow.show());
          logWindow.loadURL(APP_LOG_URL);
        }
      }
    });

    // 3. display window
    createWindow();

    // 4. initialize tray
    tray = new Tray(APP_TRAY_ICON);
    tray.setToolTip('blinksocks-desktop');
    updateContextMenu();
  } catch (err) {
    logger.error(err);
    process.exit(-1);
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

app.on('will-quit', (e) => e.preventDefault());
