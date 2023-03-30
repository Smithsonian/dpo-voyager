const crc_table = (()=>{
  let t = new Uint32Array(256);
  for(let n = 0; n < 256; n++){
    let c = n;
    for(let k = 0; k <8; k++){
      c = ((c&1) ? (3988292384 ^ (c >>> 1)) : (c >>> 1));
    }
    t[n] = c;
  }
  return t;
})();


function *_crc32() :Generator<number,number,Buffer>{
  let crc = -1;
  let next;
  while(next = yield (crc ^ (-1)) >>>0){
    for(let b of next){
      crc = ((crc >>> 8) ^ crc_table[(crc ^ b) & 0xff]);
    }
  };
  return (crc ^ (-1)) >>>0;
}

export function crc32(){
  let g = _crc32();
  g.next();
  return g;
}
