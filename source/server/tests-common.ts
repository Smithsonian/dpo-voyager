import fs from "fs/promises";
import {tmpdir} from "os";
import path from "path";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";

//@ts-ignore
import sourceMaps from "source-map-support";
import { AppLocals } from "./utils/locals";
sourceMaps.install();

chai.use(chaiAsPromised);

process.env["TEST"] ??= "true";

declare global{
  var dataStream:(src ?:Array<Buffer|string>)=>AsyncGenerator<Buffer, void, unknown>;
  var expect :typeof chai["expect"];
  var createIntegrationContext :(c:Mocha.Context)=>Promise<AppLocals>;
  var cleanIntegrationContext :(c:Mocha.Context)=>Promise<void>;
}

global.expect = chai.expect;

global.dataStream = async function* (src :Array<Buffer|string> =["foo", "\n"]){
  for(let d of src){
    let b = Buffer.isBuffer(d)?d: Buffer.from(d);
    yield await Promise.resolve(b);
  }
}

global.createIntegrationContext = async function(c :Mocha.Context){
  let {default:createServer} = await import("./server");
  let titleSlug = c.currentTest?.title.replace(/[^\w]/g, "_") ?? `eThesaurus_integration_test`;
  c.dir = await fs.mkdtemp(path.join(tmpdir(), titleSlug));
  c.server = await createServer(c.dir, {verbose: false, migrate: true, clean:false});
  return c.server.locals;
}

global.cleanIntegrationContext = async function(c :Mocha.Context){
  if(c.dir) await fs.rm(c.dir, {recursive: true});
}