import path from "path"

const values = {
  public: [true as boolean, toBool],
  brand: ["eCorpus" as string, toString],
  port: [8000 as number, toUInt ],
  migrations_path: [ path.join(process.cwd(), "migrations"), toPath],
  templates_path: [ path.join(process.cwd(), "templates"), toPath],
  root_dir: [ process.cwd(), toPath],
  trust_proxy: [true as boolean, toBool],
  hostname: ["ecorpus.holusion.net", toString],
  smart_host: ["localhost" as string, toString]
} as const;

type Converter<T> = (s:string)=>T;
type Conf<T=any> = [T, Converter<T>];


type Key = keyof typeof values;

type Config = {
  [T in Key]: typeof values[T][0];
}

function toString(s:string):string{
  return s;
}
function toPath(s:string):string{
  return path.normalize(s);
}

function toUInt(s:string):number{
  let n = parseInt(s, 10);
  if(Number.isNaN(n) || !Number.isSafeInteger(n) || n < 0) throw new Error("PORT expect a valid positive integer");
  return n;
}

function toBool(s:string):boolean{
  return !(!s || s.toLowerCase() === "false" || s == "0");
}

export function parse(env :NodeJS.ProcessEnv = process.env):Config{
  let c :Partial<Config>  = {};
  for(let [key, value] of Object.entries(values)){
    let env_value = env[`${key.toUpperCase()}`];
    c[key as Key] = (typeof env_value === "undefined")? value[0] : value[1](env_value) as any;
  }
  return c as Config;
}

export default Object.freeze(parse());
