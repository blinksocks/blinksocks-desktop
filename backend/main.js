const {app, shell, BrowserWindow, ipcMain} = require('electron');
const os = require('os');
const fs = require('fs');
const stream = require('stream');
const path = require('path');
const readline = require('readline');
const liburl = require('url');
const http = require('http');

const {DEFAULT_CONFIG_STRUCTURE} = require('./defs/bs-config-template');

const {
  MAIN_INIT,
  MAIN_ERROR,
  MAIN_START_BS,
  MAIN_START_PAC,
  MAIN_STOP_PAC,
  MAIN_STOP_BS,
  MAIN_SET_SYS_PAC,
  MAIN_SET_SYS_PROXY,
  MAIN_RESTORE_SYS_PAC,
  MAIN_RESTORE_SYS_PROXY,
  RENDERER_INIT,
  RENDERER_START_BS,
  RENDERER_STOP_BS,
  RENDERER_START_PAC,
  RENDERER_STOP_PAC,
  RENDERER_SAVE_CONFIG,
  RENDERER_SET_SYS_PAC,
  RENDERER_SET_SYS_PROXY,
  RENDERER_RESTORE_SYS_PAC,
  RENDERER_RESTORE_SYS_PROXY
} = require('./defs/events');

const packageJson = require('./package.json');

const {Hub} = require('blinksocks');
const {createSysProxy} = require('./system/create');
const {createPacService} = require('./services/pac');

const HOME_DIR = os.homedir();
const BLINKSOCKS_DIR = path.join(HOME_DIR, '.blinksocks');
const DEFAULT_GFWLIST_PATH = path.join(BLINKSOCKS_DIR, 'gfwlist.txt');

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
let bs; // blinksocks client
let pacService;
let sysProxy;

const __PRODUCTION__ =
  (typeof process.env.NODE_ENV === 'undefined') || process.env.NODE_ENV === 'production';

const DEFAULT_CONFIG_FILE = path.join(BLINKSOCKS_DIR, 'blinksocks.client.js');

function loadConfig() {
  let json;
  // resolve to absolute path
  const file = DEFAULT_CONFIG_FILE;
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
  const data = `module.exports = ${JSON.stringify(json, null, '  ')};`;
  fs.writeFile(DEFAULT_CONFIG_FILE, data, (err) => {
    if (err) {
      console.error(err);
    }
  });
}

function parseRules(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        const sr = new stream.PassThrough();
        sr.end(Buffer.from(data, 'base64').toString('ascii'));
        const rl = readline.createInterface({input: sr});
        let index = 0;
        const domains = [];
        rl.on('line', (line) => {
          if (!(line.startsWith('!')) && line.length > 0 && index !== 0) {
            domains.push(line);
          }
          index += 1;
        });
        rl.on('close', () => resolve(domains));
      }
    });
  });
}

function onAppClose() {
  // 1. shutdown pac service
  if (pacService) {
    pacService.stop();
    pacService = null;
  }
  // 2. shutdown blinksocks client
  if (bs) {
    bs.terminate();
    bs = null;
  }
  // 3. restore all system settings
  if (sysProxy) {
    Promise
      .all([
        sysProxy.restoreGlobal({
          host: config.host,
          port: config.port,
          bypass: config.bypass
        }),
        sysProxy.restorePAC({url: config.pac})
      ])
      .then(() => null);
  }
  // 4. save config
  saveConfig(Object.assign({}, config, {app_status: 0, pac_status: 0}));
}

// Electron stuff

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
      pathname: path.join(__dirname, 'build/index.html'),
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
    pacService = createPacService();
    // 2. display window
    createWindow();
  } catch (err) {
    console.error(err);
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

app.on('before-quit', onAppClose);

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

const ipcHandlers = {
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
      switch (err.code) {
        case 'EADDRINUSE':
          bs.terminate();
          bs = null;
          break;
        default:
          break;
      }
      e.sender.send(MAIN_ERROR, err);
      console.error(err);
    });

    e.sender.send(MAIN_INIT, {config});
  },
  [RENDERER_START_BS]: (e, {config}) => {
    if (!bs) {
      bs = new Hub(config);
      bs.run(() => e.sender.send(MAIN_START_BS));
    }
  },
  [RENDERER_STOP_BS]: (e) => {
    if (bs) {
      bs.terminate();
      bs = null;
    }
    e.sender.send(MAIN_STOP_BS);
  },
  [RENDERER_SAVE_CONFIG]: (e, json) => {
    saveConfig(json);
    config = json; // update cached global.config
  },
  [RENDERER_START_PAC]: async (e, {url}) => {
    const {host, port} = liburl.parse(url);
    if (pacService) {
      const rules = await parseRules(DEFAULT_GFWLIST_PATH);
      pacService.start({
        host,
        port,
        proxyHost: config.host,
        proxyPort: config.port,
        rules
      });
      e.sender.send(MAIN_START_PAC);
    }
  },
  [RENDERER_STOP_PAC]: (e) => {
    if (pacService) {
      pacService.stop();
    }
    e.sender.send(MAIN_STOP_PAC);
  },
  [RENDERER_SET_SYS_PROXY]: async (e, {host, port, bypass}) => {
    await sysProxy.setGlobal({host, port, bypass});
    e.sender.send(MAIN_SET_SYS_PROXY);
  },
  [RENDERER_SET_SYS_PAC]: async (e, {url}) => {
    await sysProxy.setPAC({url});
    e.sender.send(MAIN_SET_SYS_PAC);
  },
  [RENDERER_RESTORE_SYS_PROXY]: async (e, {host, port, bypass}) => {
    await sysProxy.restoreGlobal({host, port, bypass});
    e.sender.send(MAIN_RESTORE_SYS_PROXY);
  },
  [RENDERER_RESTORE_SYS_PAC]: async (e, {url}) => {
    await sysProxy.restorePAC({url});
    e.sender.send(MAIN_RESTORE_SYS_PAC);
  }
};

Object.keys(ipcHandlers).forEach(
  (eventName) => ipcMain.on(eventName, ipcHandlers[eventName])
);
