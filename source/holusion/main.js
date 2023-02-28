'use strict';
const { app, BrowserWindow } = require('electron');
const { once } = require('events');

const handle = require("./handler");

const isProduction = process.env["NODE_ENV"] !== "development" || process.platform == "win32";

let windowOptions = {
  backgroundColor: "#000000",
  icon: "../../dist/favicon.png",
  width:((/\d+/.test(process.env.WIDTH))? parseInt(process.env.WIDTH) : 1920+1920),
  height:((/\d+/.test(process.env.HEIGHT))? parseInt(process.env.HEIGHT) : 1080),
  frame: false,
  webPreferences:{
    zoomFactor: 1,
  }
}

if(!isProduction){
  Object.assign(windowOptions, {
    width: 1920,
    height: 1080/2,
    frame: true,
  });
  Object.assign(windowOptions.webPreferences, {
    zoomFactor: 0.5,
  })
}

const zip = app.getPath("cache");

(async ()=>{
  if(!isProduction) console.log("Running in development mode.");
  const [server] = await Promise.all([
    handle({zip}),
    app.whenReady(),
  ]);
  const win = new BrowserWindow(windowOptions);
  win.loadURL(`http://localhost:${server.address().port}?lang=FR`)
  let webContents = win.webContents
  webContents.on('did-finish-load', () => {
    webContents.setZoomFactor(windowOptions.webPreferences.zoomFactor)
  });
  await once(app, 'window-all-closed');
  app.quit();
})();