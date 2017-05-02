const {app, shell, BrowserWindow, ipcMain} = require('electron');
const os = require('os');
const fs = require('fs');
const stream = require('stream');
const path = require('path');
const readline = require('readline');
const liburl = require('url');
const http = require('http');

const {DEFAULT_CONFIG_STRUCTURE} = require('../common/bs-config-template');
const {makePAContent} = require('./helpers/pac-generator');

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
} = require('../common/events');

const packageJson = require('../package.json');

const {Hub} = require('blinksocks');
const {createSysProxy} = require('./system');

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
let pacServer;
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

// PAC stuff

function parseGFWList(filePath) {
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

async function startPACService(host, port) {
  if (!pacServer) {
    const rules = await parseGFWList(DEFAULT_GFWLIST_PATH);
    const fileData = makePAContent(rules, config.host, config.port);
    pacServer = http.createServer((req, res) => {
      res.writeHead(200, {
        'Server': 'blinksocks-desktop',
        'Content-Type': 'application/x-ns-proxy-autoconfig',
        'Content-Length': fileData.length,
        'Cache-Control': 'no-cache',
        'Date': (new Date).toUTCString(),
        'Connection': 'Close'
      });
      res.end(fileData);
    });
    pacServer.on('clientError', (err, socket) => {
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    });
    pacServer.listen(port, () => {
      console.log(`started local PAC server at: ${host}`);
    });
  }
}

function stopPACService() {
  if (pacServer) {
    pacServer.close();
    pacServer = null;
  }
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
app.on('ready', () => {
  // 1. initialize then cache
  config = loadConfig();
  sysProxy = createSysProxy();

  // 2. display window
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

    if (process.platform === 'win32') {
      require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      }).on('SIGINT', function () {
        process.emit('SIGINT');
      });
    }

    process.on('SIGINT', () => {
      sender.send(MAIN_TERMINATE);
    });

    process.on('SIGTERM', function () {
      sender.send(MAIN_TERMINATE);
    });

    // handle force quit, e,g. Cmd + Q
    app.on('before-quit', () => {
      sender.send(MAIN_TERMINATE);
    });
  },
  [RENDERER_START_BS]: (e, json) => {
    if (!bs) {
      try {
        bs = new Hub(json);
        bs.run();
      } catch (err) {
        e.sender.send(MAIN_ERROR, err);
        console.log(err);
      }
    }
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
  [RENDERER_SET_SYS_PAC]: (e, service, {enabled, url}) => {
    if (enabled) {
      const {host, port} = liburl.parse(url);
      startPACService(host, port);
      sysProxy.setPAC(service, url);
      console.info(`set system PAC to: ${url}`);
    } else {
      stopPACService();
      sysProxy.setPAC(service, '');
      console.info(`disable system PAC`);
    }
  },
  [RENDERER_SET_SYS_PROXY]: (e, service, {enabled, host, port}) => {
    if (enabled) {
      sysProxy.setSocksProxy(service, host, port);
      sysProxy.setHTTPProxy(service, host, port);
      console.info(`set system proxy(Socks and HTTP) to: ${host}:${port}`);
    } else {
      sysProxy.setSocksProxy(service, '', 0);
      sysProxy.setHTTPProxy(service, '', 0);
      console.info(`disable system proxy(Socks and HTTP)`);
    }
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
