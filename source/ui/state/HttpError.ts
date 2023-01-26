export default class HttpError extends Error{
  code :number;
  constructor(code :number, message){
    super(`${message}`);
    this.code = code;
  }
  static async okOrThrow(res :Response) :Promise<Response>{
    if(res.ok) return res;
    try{
      let {code, message} = await res.json();
      throw new HttpError(code, message);
    }catch(e){
      if( !(e instanceof HttpError))
        throw new HttpError(res.status, res.statusText);
      else throw e;
    }
  }
}
