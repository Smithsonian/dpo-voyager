import { RequestHandler } from "express";



export const postLogout :RequestHandler = (req, res)=>{
  req.session = null;
  res.status(200).send({code: 200, message: "OK"});
};