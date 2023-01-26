import crypto from "crypto";


const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
//Binary to string lookup table
const b2s = alphabet.split('');
//String to binary lookup table
const s2b = new Array(123);
for (let i = 0; i < alphabet.length; i++) {
  s2b[alphabet.charCodeAt(i)] = i;
}
/**
 * Creates a, encoded globally unique identifier with a default length of 12 characters.
 * The identifier only uses letters and digits and can safely be used for file names.
 * this is NOT a proper base 56 encoding. 
 * While the result should be crypto-secure
 * @param length Number of characters in the identifier.
 * @returns Globally unique identifier
 * @see https://codegolf.stackexchange.com/questions/1620/arbitrary-base-conversion/21672#21672
 */
 export default function uid(size :number = 12){

  let data = Array.from(crypto.randomBytes(size));

  let id = [];
  let quotient = [];
  let carry = 0;
  for(let b of data){
    let accumulator = b + carry * 256;
    let digit = accumulator  / alphabet.length | 0;
    carry = accumulator % alphabet.length;
    if(quotient.length || digit){
      quotient.push(digit);
    }
    id.unshift(carry);
  }
  return  id.reduce((str, idx)=> str+alphabet[idx], "");
}

export class Uid{
  /**
   * generate a random number that is a safe 48bit uint
   */
  static make() :number{
    return crypto.randomBytes(6).readUIntLE(0,6);
  }
  /**
   * maps an unsigned integer ID to a base64url string
   */
  static toString(n :number) :string{
    if(n < 0 || !Number.isSafeInteger(n)) throw new Error(`Bad ID : ${n} is not a safe positive integer`);
    let b = Buffer.alloc(6);
    b.writeUintBE(n, 0, 6);
    return b.toString("base64url");
  }
  /**
   * maps a base64url encoded ID to an uint
   */
  static toNumber(str :string) :number{
    let b = Buffer.from(str, "base64url");
    if(b.length != 6) throw new Error(`Bad ID : ${str} is not a valid base64 encoded ID`);
    return b.readUintBE(0,6);
  }
}