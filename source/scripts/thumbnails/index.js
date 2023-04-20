'use strict';
import puppeteer from "puppeteer";
import timers from "node:timers/promises";
import {program, InvalidArgumentError} from "commander";

program
  .name("thumbnailer")
  .option("-u, --user", "username to authenticate with")
  .option("-p --password", "password to authenticate with")
  .option("--no-headless", "disable headless mode for debugging")
  .argument("<target>", "target URL", (t)=>{
    try{
      return new URL(t);
    }catch(e){
      throw new InvalidArgumentError(e.message);
    }
  });


program.action(async(target, {username, password, headless}, command)=>{
  username ??= target.username;
  password ??= target.password;
  target.username = "";
  target.password = "";
  const browser = await puppeteer.launch({ headless });
  try{
    const res = await fetch(new URL(`/api/v1/scenes`, target), {
      headers:{
        "Accept": "application/json",
        "Authorization": `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`
      }
    });
    if(!res.ok) throw new Error(`Fetch rejected : ${await res.json()}`);
    const scenes = await res.json();
    const scenesToFix = scenes.filter(s=>!s.thumb);

    console.log("%d scenes to fix : ", scenesToFix.length);
    const page = await browser.newPage();
  
    if(username && password) await page.authenticate({username, password});

    page.on("dialog", dialog => dialog.type() === "beforeunload" && dialog.accept());

    page.on('requestfailed', request => {
      if(request.failure().errorText == "net::ERR_ABORTED") return;
      console.error(`url: ${request.url()}, errText: ${request.failure().errorText}, method: ${request.method()}`);
      process.exit(127);
    });

    for(let scene of scenesToFix){
      await page.goto(new URL(`/ui/scenes/${encodeURIComponent(scene.name)}/edit`, target));
      await page.waitForFunction(()=>document.querySelector("voyager-explorer")?.shadowRoot.querySelector("sv-spinner")?.style.visibility === "hidden");
      const explorer = await page.evaluateHandle(`document.querySelector("voyager-explorer")`);
      await page.click(`sv-task-bar ff-button[icon="camera"]`);
      await page.waitForSelector(`sv-capture-task-view`);
      await page.click(`sv-capture-task-view ff-button[icon="camera"]`);
      await timers.setTimeout(1000);
      await page.click(`sv-capture-task-view ff-button[icon="save"]`);
      await timers.setTimeout(100);
      await page.waitForNetworkIdle({idleTime: 100, timeout: 2000 });
      await page.click(`sv-task-bar ff-button[icon="save"]`);
      await page.waitForNetworkIdle({idleTime: 100, timeout: 2000 });
      console.log("Added a thumbnail to ", scene.name);
    }

  }finally{
    await browser.close();
  }
});
  
await program.parseAsync();
