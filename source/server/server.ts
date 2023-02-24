
import path from "path";
import cookieSession from "cookie-session";
import express, { NextFunction, Request, Response, Router } from "express";
import { engine } from 'express-handlebars';
import morgan from "morgan";

import UserManager from "./auth/UserManager";
import { HTTPError, NotFoundError } from "./utils/errors";
import { mkdir } from "fs/promises";

import {AppLocals, getHost} from "./utils/locals";

import openDatabase from './vfs/helpers/db';
import Vfs from "./vfs";
import importAll from "./vfs/helpers/import";
import config from "./utils/config";
import wrap from "./utils/wrapAsync";


export default async function createServer(rootDir :string, /*istanbul ignore next */{
  verbose = process.env["NODE_ENV"] !== "production",
  hotReload = process.env["HOT"] !=="false" && process.env["NODE_ENV"] == "development",
  clean = true,
  migrate = true
}={}) :Promise<express.Application>{
  const staticDir = path.resolve(rootDir, "dist/");
  const assetsDir = path.resolve(rootDir, "assets/");
  const fileDir = path.resolve(rootDir, "files/");
  const docDir = path.resolve(rootDir, "source/docs/");

  await Promise.all([fileDir].map(d=>mkdir(d, {recursive: true})));
  let db = await openDatabase({filename: path.join(fileDir, "database.db"), migrate: true});
  const vfs = await Vfs.Open(fileDir, {db});
  const userManager = new UserManager(db);


  const app = express();
  app.disable('x-powered-by');
  app.set("trust proxy", config.trust_proxy);

  // MIGRATION FROM WEBDAV
  if((migrate && ((await userManager.userCount())) <= 2)){
    await importAll(fileDir, fileDir);
    console.log("Application is in open mode");
    app.locals.isOpen = true; //Allow arbitrary users creation
  }
  // END OF MIGRATION

  if(clean) setTimeout(()=>{
    //Clean file system after a while to prevent delaying startup
    vfs.clean().catch(e=>console.error(e));
  }, 12000);

  app.use(cookieSession({
    name: 'session',
    keys: await userManager.getKeys(),
    // Cookie Options
    maxAge: 31 * 24 * 60 * 60 * 1000 // 1 month
  }));


  app.locals  = Object.assign(app.locals, {
    userManager,
    fileDir,
    vfs,
  }) as AppLocals;
  
  /* istanbul ignore next */
  if (verbose) {
    //Requests logging
    app.use(morgan(process.stdout.isTTY?"dev": "tiny", {
      skip: function(req, res){
        if(400 <= res.statusCode) return false; //Log all errors
        if(req.originalUrl.indexOf("/scenes") == 0) return false; //Log all requests to /scenes
        return true;
      }
    }));
  }


  app.engine('.hbs', engine({
    extname: '.hbs',

  }));
  app.set('view engine', '.hbs');
  app.set('views', config.templates_path);


  app.get("/", (req, res)=> res.redirect("/ui/scenes"));

  /* istanbul ignore next */
  app.get("/ui/scenes/:scene/view", (req, res)=>{
    let {scene} = req.params;
    let {lang} = req.query;
    let host = getHost(req);
    let referrer = new URL(req.get("Referrer")||`/ui/scenes/`, host);
    let thumb = new URL(`/scenes/${encodeURIComponent(scene)}/scene-image-thumb.jpg`, host);

    res.render("explorer", {
      title: `${scene}: Explorer`,
      scene,
      thumb: thumb.toString(),
      referrer: referrer.toString(),
      lang: ((typeof lang === "string")?lang.toUpperCase():"FR"),
    });
  });

  app.get("/ui/scenes/:scene/edit",(req, res)=>{
    let {scene} = req.params;
    let {lang} = req.query;
    let host = getHost(req);
    let referrer = new URL(req.get("Referrer")||`/ui/scenes/`, host);
    let thumb = new URL(`/scenes/${encodeURIComponent(scene)}/scene-image-thumb.jpg`, host);
    
    res.render("story", {
      title: `${scene}: Story Editor`,
      scene,
      thumb: thumb.toString(),
      referrer: referrer.toString(),
      mode: "Edit",
      lang: ((typeof lang === "string")?lang.toUpperCase():"FR"),
    });
  });

  app.get(["/ui/", "/ui/*"],(req, res)=>{
    res.render("home", {
      title: "eCorpus",
      thumb: "/images/sketch_ethesaurus.png"
    });
  });

  /* istanbul ignore next */
  if(hotReload){
    console.log("Hot reload enabled");
    const {default: webpack} = await import("webpack");
    const {default: middleware} = await import("webpack-dev-middleware");
    //@ts-ignore
    const {default: config} = await import("../ui/webpack.config.js");
    const compiler = webpack(config());
    const webpackInstance = middleware(compiler as any, {});
    app.use(webpackInstance);
    await new Promise(resolve=> webpackInstance.waitUntilValid(resolve));
  }else{
    // static file server
    app.use("/", express.static(staticDir));
  }
  app.use("/", express.static(assetsDir));
  // documentation server
  let docOpts =  {extensions:["md", "html"], index:["index.md", "index.html"]}
  app.use("/doc", express.static(docDir, {...docOpts, fallthrough: true}));
  app.use("/doc/:lang(fr)", express.static(path.join(docDir, "en"), docOpts));

  app.use("/libs", (await import("./routes/libs")).default);



  //Privilege-protected routes
  app.use("/scenes", (await import("./routes/scenes")).default);

  app.use("/api/v1", (await import("./routes/api/v1")).default);
  // error handling
  // istanbul ignore next
  //@ts-ignore
  app.use((error, req, res, next) => {
    process.env["TEST"] == 'true' || console.error(error);
    
    if (res.headersSent) {
      console.warn("Error happened after headers were sent for %s : %s", req.method, req.originalUrl);
        return next(error);
    }
    let code = (error instanceof HTTPError )? error.code : 500;
    res.format({
      "application/json": ()=> {
        res.status(code).send({ code, message: `${error.name}: ${error.message}` })
      },
      "text/html": ()=>{
        // send error page
        res.status(code).render("error", { error });
      },
      "text/plain": ()=>{
        res.status(code).send(error.message);
      },
      default: ()=> res.status(code).send(error.message),
    });
  });

  return app;
}
