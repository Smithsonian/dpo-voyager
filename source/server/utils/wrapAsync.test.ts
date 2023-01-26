import { expect } from "chai";
import timers from "timers/promises"
import express, { Express, NextFunction, Request, Response } from "express";
import request from "supertest";

import wrap, { wrapFormat } from "./wrapAsync";


describe("wrapAsync", function(){
  it("keeps a function name", function(){
    function foo(){};
    expect(wrap(foo as any).name).to.equal("foo");
  });
  it("can wrap arrow functions", function(){
    const foo = ()=>{};
    expect(wrap(foo as any).name).to.equal("anonymousHandler");
  });
  it("can wrap bound functions", function(){
    function foo(){};
    expect(wrap(foo.bind(null) as any).name).to.equal("anonymousHandler");
  });
  it("wrap errors", function(done){
    function foo(){
      return Promise.reject(new Error("bar"));
    }
    let fn = wrap(foo);
    fn({} as any, {} as any, (err)=>{
      expect(err).to.match(/bar/);
      done();
    });
  });
});

describe("wrapFormat", function(){
  describe("express integration", function(){
    let app :Express;
    this.beforeEach(function(){
      app = express();
    })
    it("handles accepted formats asynchronously", async function(){

      app.get("/", wrap(async (req, res)=>{
        await wrapFormat(res, {
          "application/json": async ()=>{
            await timers.setImmediate();
            res.status(200).send({code: 200, message:"OK"})
          },
          "text/plain": async ()=>{
            await timers.setImmediate();
            res.status(200).send({code: 200, message:"OK"})
          }
        });
      }));
      await request(app).get("/")
      .set("Accept", "text/plain")
      .expect("Content-Type", "text/plain; charset=utf-8");

      await request(app).get("/")
      .set("Accept", "application/json")
      .expect("Content-Type", "application/json; charset=utf-8");
    });

    it("is a drop-in replacement for res.format()", async function(){

      app.get("/", wrap(async (req, res)=>{
        await wrapFormat(res, {
          "application/json": ()=> res.status(200).send({code: 200, message:"OK"}) ,
          "text/plain": ()=>res.status(200).send({code: 200, message:"OK"})
        });
      }));
      await request(app).get("/")
      .set("Accept", "text/plain")
      .expect("Content-Type", "text/plain; charset=utf-8");

      await request(app).get("/")
      .set("Accept", "application/json")
      .expect("Content-Type", "application/json; charset=utf-8");
    });
    
    it("handles errors", async function(){
      app.get("/", wrap(async (req, res)=>{
        await wrapFormat(res, {
          default: async ()=>{
            await timers.setImmediate();
            throw new Error("FOO");
          },
        });
      }));
      app.use((err :Error, req :Request, res :Response, next :NextFunction)=> res.status(500).send(err.message));

      await request(app).get("/")
      .set("Accept", "text/plain")
      .expect(500)
      .expect(/FOO/);
    });
  })
});