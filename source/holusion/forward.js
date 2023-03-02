const https = require('https');
const {once} = require("events");

/**
 * @typedef {object} ForwardTarget
 * @property {string} path
 * @property {"GET"|"POST"|"PUT"} method
 * @property {import('http').OutgoingHttpHeaders} [headers]
 * @property {string} [body]
 * @property {AbortSignal} [signal]
 */

/**
 * Simplified request forwarding
 * @param {ForwardTarget} to 
 * @return {Promise<import("http").IncomingMessage>}
 */

async function forward(to){
  let headers = to.headers ?? {};
  let req = https.request({
    method: to.method,
    hostname: "ecorpus.holusion.net",
    path: to.path,
    headers: {
      "Content-Length": to.body? Buffer.byteLength(to.body): 0,
      ...headers,
    },
    signal: to.signal,
    timeout: 2000
  });
  if(to.body) req.write(to.body);
  req.end();
  let [res] = await once(req, "response", {signal: to.signal });
  return res;
}


/**
 * Simplified request forwarding
 * @param {ForwardTarget} to 
 * @return {Promise<import("http").IncomingMessage & {text:string, json:any}>}
 */
async function drain(to){
  let r = await forward(to);
  let text = ""
  r.setEncoding("utf8");
  for await (let d of r){
    text += d;
  }
  let json = {};
  try{
    json = JSON.parse(text);
  }catch(e){}

  return Object.assign(r, {text, json});
}

module.exports = {
  forward,
  drain
}