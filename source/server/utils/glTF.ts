import fs from "fs/promises";
import assert from "assert/strict";



interface Accessor {
  componentType :5120|5121|5122|5123|5125|5126;
  type :"SCALAR"|"VEC1"|"VEC2"|"VEC3"|"VEC4"|"MAT2"|"MAT3"|"MAT4";
  count :number;
  min?:number[];
  max?:number[];
}

interface Primitive {
  attributes:{
    NORMAL :number;
    POSITION :number;
    TANGENT ?:number;
    TEXCOORD_0 ?:number;
  }
  targets ?:[{POSITION :number}];
  indices :number;
}
interface Mesh {
  name :string;
  primitives: Primitive[];
}
interface Bounds { 
  min: [number, number, number], 
  max: [number, number, number]
}

interface MeshDescription {
  position: [number, number, number];
  bounds :Bounds;
  numFaces: number;
  name ?:string;
}


interface SceneDescription{
  meshes :MeshDescription[];
  bounds :Bounds;
  byteSize ?:number;
}

interface GlbDescription extends SceneDescription{
  byteSize :number;
}

export interface JSONglTF extends Record<string,any>{
  meshes: Mesh[];
  accessors :Accessor[];
}

function asBounds(a :Accessor) :Bounds{
  if(!(a.min?.length == 3 && a.max?.length == 3 )) assert.fail("min and max MUST be defined in glTF mesh position");
  return a as any as Bounds;
}

function mergeBounds(a:Bounds, b:Bounds) :Bounds{
  return {
    min: a.min.map((value, index)=>(("min" in b)?Math.min(value, b.min[index]):value)) as any,
    max:a.max.map((value, index)=>(("max" in b)?Math.max(value, b.max[index]):value)) as any,
  };
}

/**
 * 
 * Float values are rounded to single precision.
 * @see https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/Specification.adoc#3625-accessors-bounds
 */
export function parse_glTF(gltf :JSONglTF) :SceneDescription {
  let scene :SceneDescription = {
    meshes:[],
    bounds: {min:[0,0,0], max:[0,0,0]},
  };
  for(let mesh of gltf.meshes){
    let out :MeshDescription = {
      position: [0, 0, 0],
      bounds: {min:[0,0,0], max:[0,0,0]},
      numFaces: 0,
      name: mesh.name
    };
    for(let primitive of mesh.primitives){
      let positions = [primitive.attributes.POSITION, ...(primitive.targets ?? []).map(t=>t.POSITION)]
      for (let positionIndex of positions){
        let position :Bounds|Accessor = gltf.accessors[positionIndex];
        out.bounds = mergeBounds(out.bounds, asBounds(position));
        out.numFaces+= gltf.accessors[primitive.indices].count /3; //every 3 indices form a triangle
      }
    }
    scene.meshes.push(out);
    scene.bounds = mergeBounds(scene.bounds, out.bounds);
  }
  return scene;
}




export async function parse_glb(filePath :string) :Promise<GlbDescription>{
  let res :MeshDescription = {} as any;
  let handle = await fs.open(filePath, "r");
  //https://docs.fileformat.com/3d/glb/
  try{
    let header = Buffer.alloc(3*4);
    let {bytesRead} = await handle.read({buffer:header});
    assert.equal(bytesRead, 3*4 as number, `Could not read glb header (file too short ${bytesRead})`);
    let magic = header.readUint32LE(0);
    assert(magic == 0x46546C67, "bad magic number : 0x"+magic.toString(16))
    let version = header.readUInt32LE(4);
    assert(version == 0x2, `gltf files version ${version} not supported. Please provide a glTF2.0 file`);
    let byteSize = header.readUInt32LE(8);

    let position = header.length; //position is not updated when we skip blocks
    let chunkHeader = Buffer.allocUnsafe(4*2);
    while( (await handle.read({buffer:chunkHeader, position})).bytesRead == 8){
      position += 8;
      let chunkLength = chunkHeader.readUint32LE(0);
      let chunkType = chunkHeader.readUInt32LE(4);
      if(chunkType !=	0x4E4F534A){
        position += chunkLength;
        continue;
      }
      let data = Buffer.allocUnsafe(chunkLength)
      let {bytesRead} = await handle.read({buffer:data, position});
      assert(bytesRead == chunkLength, "Reached end of file while trying to get JSON chunk");
      let gltfData :JSONglTF = JSON.parse(data.toString("utf-8"));
      return {...parse_glTF(gltfData), byteSize};
    }
  }finally{
    await handle.close();
  }
  assert.fail("Can't find glTF data ");
}