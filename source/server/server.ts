
import path from "path";
import cookieSession from "cookie-session";
import express from "express";
import { engine } from 'express-handlebars';

import UserManager from "./auth/UserManager";
import { HTTPError } from "./utils/errors";
import { mkdir } from "fs/promises";

import {AppLocals, getHost} from "./utils/locals";

import openDatabase from './vfs/helpers/db';
import Vfs from "./vfs";
import config from "./utils/config";


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
  let db = await openDatabase({filename: path.join(fileDir, "database.db"), migrate: migrate});
  const vfs = await Vfs.Open(fileDir, {db});
  const userManager = new UserManager(db);


  const app = express();
  app.disable('x-powered-by');
  app.set("trust proxy", config.trust_proxy);


  if(clean) setTimeout(()=>{
    //Clean file system after a while to prevent delaying startup
    vfs.clean().catch(e=>console.error(e));
  }, 60000);

  app.use(cookieSession({
    name: 'session',
    keys: await userManager.getKeys(),
    // Cookie Options
    maxAge: 31 * 24 * 60 * 60 * 1000, // 1 month
    sameSite: "strict"
  }));


  app.locals  = Object.assign(app.locals, {
    userManager,
    fileDir,
    vfs,
  }) as AppLocals;
  
  /* istanbul ignore next */
  if (verbose) {
    let {default: morgan} = await import("morgan"); 
    //Requests logging is enabled only in dev mode as a proxy would handle it in production
    app.use(morgan(process.stdout.isTTY?"dev": "tiny", {
    }));
  }


  app.engine('.hbs', engine({
    extname: '.hbs',

  }));
  app.set('view engine', '.hbs');
  app.set('views', config.templates_path);


  app.get(["/", "/ui/"], (req, res)=> res.redirect("/ui/scenes"));

  /**
   * Set permissive cache-control for ui pages
   */
  app.use(["/ui", "/js", "/css", "/doc", "/language"], (req, res, next)=>{
    res.set("Cache-Control", `max-age=${30*60}, public`);
    next();
  });
  /**
   * Set even more permissive cache-control for static assets
   */
  app.use(["/images", "/fonts", "/favicon.png"], (req, res, next)=>{
    res.set("Cache-Control", `max-age=${60*60*24*30*12}, public`);
    next();
  });

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
  
  app.get("/ui/standalone", (req, res)=>{
    let {lang} = req.query;
    let host = getHost(req);
    let referrer = new URL(req.get("Referrer")||`/ui/scenes/`, host);

    res.render("story", {
      title: `Standalone Story`,
      mode: "Standalone",
      thumb: "/images/sketch_ethesaurus.png",
      referrer: referrer.toString(),
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
