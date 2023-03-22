import { Request, RequestHandler, Response } from "express";
import xml from 'xml-js';
import path from "path";
import { AppLocals, getHost, getUser } from "../../utils/locals";
import Vfs, { FileProps, ItemProps } from "../../vfs";

interface ElementProps{
  ctime:Date;
  mtime:Date;
  isDirectory ?:boolean;
}

interface DirElementProps extends ElementProps{
  isDirectory :true;
}

interface FileElementProps extends ElementProps{
  size :number;
  mime :string;
}


type DavTAG = "D:href"|"D:response"|"D:propstat"|"D:href"|"D:status"|"D:prop"|"D:getlastmodified"|"D:creationdate"|"D:displayname"|"D:lockdiscovery"|"D:supportedlock"|"D:resourcetype"|"D:getcontentlength"|"D:getcontenttype"|"D:collection"

type ElementList = Array<Element|TextElement>;
class Element{
  constructor(
    public name :DavTAG,
    public elements ?:ElementList,
    public type ="element",
  ){}
  static fromOK() :Element{
    return {
      "type": "element",
      "name": "D:status",
      "elements": [
        {
          "type": "text",
          "text": "HTTP/1.1 200 OK"
        }
      ]
    };
  }



  static fromProps(filename :string, props :FileElementProps|DirElementProps|ElementProps) :Element{
    if(typeof props.mtime.toUTCString != "function") console.log("from props : ", filename, props);
    let infos :ElementList =  [
      {
        "type": "element",
        "name": "D:getlastmodified",
        "elements": [ { "type": "text", "text": props.mtime.toUTCString() } ]
      },
      { "type": "element", "name": "D:lockdiscovery" },
      { "type": "element", "name": "D:supportedlock", "elements": [] },
      {
        "type": "element",
        "name": "D:creationdate",
        "elements": [
          {
            "type": "text",
            "text": props.ctime.toUTCString(),
          }
        ]
      },
      (("isDirectory" in props && props.isDirectory)?{
        "type": "element",
        "name": "D:resourcetype",
        "elements": [{"type": "element", "name":  "D:collection"}]
      } : {"type": "element", "name": "D:resourcetype" }),
      {
        "type": "element",
        "name": "D:displayname",
        "elements": [
          {
            "type": "text",
            "text": filename,
          }
        ]
      },
    ];
    if('size' in props){
      infos.push({
        "type": "element",
        "name": "D:getcontentlength",
        "elements": [
          {
            "type": "text",
            "text": props.size.toString(10),
          }
        ]
      })
    }
    if('mime' in props && !(props as any).isDirectory ){
      infos.push({
        "type": "element",
        "name": "D:getcontenttype",
        "elements": [
          {
            "type": "text",
            "text": props.mime,
          }
        ]
      })

    }

    return {
      "type": "element",
      "name": "D:prop",
      "elements": infos
    }
  }
  static fromFile(href :URL, stats :FileElementProps|DirElementProps|ElementProps) :Element{
    return {
      "type": "element",
      "name": "D:response",
      "elements": [
        {
          "type": "element",
          "name": "D:href",
          "elements": [
            {
              "type": "text",
              "text": href.toString(),
            }
          ]
        },
        {
          "type": "element",
          "name": "D:propstat",
          "elements": [ 
            Element.fromOK(),
            Element.fromProps(path.basename(href.toString()), stats),
          ]
        },
      ]
    }
  }
}
interface TextElement{
  type :"text";
  text :string;
}

async function getSceneFiles(vfs:Vfs, rootUrl:URL, scene_name:string, recurse:number){
  let elements :ElementList = [];
  let scene = await vfs.getScene(scene_name);

  let sceneUrl = new URL(path.join("scenes", scene_name)+"/", rootUrl);
  elements.push(Element.fromFile(sceneUrl, {...scene, isDirectory: true}));

  if(recurse <= -1 || 2 <= recurse ){

    let files :FileProps[] = await vfs.listFiles(scene.id, false, true);
    
    elements.push(
      Element.fromFile(new URL(`scene.svx.json`, sceneUrl),  {...scene}),
      ...files.filter(f => recurse <= -1 || f.name.split("/").length +1 <= recurse ).map(f => {
        let isDirectory =  f.mime == "text/directory"
        return Element.fromFile(
          new URL(f.name + (isDirectory? "/": ""), sceneUrl),
          {
            ctime: f.ctime,
            mtime: f.mtime,
            size: f.size,
            isDirectory,
            mime: f.mime,
          }
        );
      }),
    )
  }

  return elements;
}

async function getScenes(vfs :Vfs, rootUrl:URL, recurse :number, user_id ?:number):Promise<ElementList>{
  let scenes = await vfs.getScenes(user_id);
  let elements = (await Promise.all(scenes.map(m=> getSceneFiles(vfs, rootUrl, m.name, recurse-1)))).flat();
  let stats = {
    isDirectory: true,
    author: "default",
    author_id: 0,
    ctime: scenes.reduce((ref, m)=> ((ref < m.ctime)?ref : m.ctime), scenes[0]?.ctime ?? new Date()),
    mtime: scenes.reduce((ref, m)=> ((m.mtime < ref)?ref : m.mtime), scenes[0]?.mtime ?? new Date()),
  }
  elements.unshift(Element.fromFile(new URL("scenes/", rootUrl), stats));
  return elements;
}


/**
 * PROPFIND request on a directory. Doesn't support anything fancy like props selections.
 * It works a bit backward by always fetching everything from the root, as deep as needed, then filtering out what isn't required when requesting subfolders
 */
export async function handlePropfind(req :Request, res:Response){
  let u = getUser(req);
  const {scene:scene_name} = req.params;
  const {vfs} = req.app.locals as AppLocals;
  let recurse = parseInt(req.get("Depth")??"-1");
  if(!Number.isSafeInteger(recurse)) throw new Error("Invalid Depth header : "+req.get("Depth"));
  
  let rootUrl = getHost(req);
  let p = path.normalize(req.path);
  let depth = (recurse == -1)? -1 : recurse + p.split("/").length + (p.endsWith("/")?-1:0);
  let elements :ElementList;
  if(scene_name){
    elements =await getSceneFiles(vfs, rootUrl, scene_name, depth);
  }else{
    elements = await getScenes(vfs, rootUrl, depth, (u.isAdministrator? undefined: u.uid));
  }
  elements = elements.filter(e=>{
    //@ts-ignore
    let href = e?.elements[0]?.elements[0]?.text;
    if(!href){ console.log("No href for : ",e); return false;}
    let uri = new URL(href, ).pathname;
    return uri.indexOf(p) !==-1;
  });

  res.set({
    "DAV": "1,2",
    "Content-Type": "application/xml;charset=utf-8",
  }).status(207).send(xml.js2xml({
    declaration: {attributes: {version: "1.0", encoding:"utf-8"}},
    elements:[{
      type: "element",
      name: "D:multistatus",
      attributes: {
        "xmlns:D": "DAV:"
      },
      elements,
    }],
  }));
};
