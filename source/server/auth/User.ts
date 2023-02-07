
export interface SafeUser{
  uid :number;
  isAdministrator ?:boolean;
  isDefaultUser ?:boolean;
  username :string;
  email ?:string;
}

export interface StoredUser{
  user_id :number;
  username :string;
  email :string|undefined;
  password :string|undefined;
  isAdministrator :0|1;
}

export default class User implements SafeUser {
  uid :number;
  isAdministrator ?:boolean = false;
  username :string;
  email ?:string|undefined;
  password :string|undefined;

  get isDefaultUser(){
    return this.uid == 0;
  }

  constructor({username, password, uid, email, isAdministrator} :{
    username:string, password?:string, uid:number, email?:string, isAdministrator?:boolean
  } ){
    this.username = username;
    this.password = password;
    this.isAdministrator = !!isAdministrator;
    this.uid = uid;
    this.email = email;
  }
  static createDefault(){
    return new User({uid: 0, username: "default", password: ""});
  }
    /**
   * Make a user safe for export and public use (remove password field)
   */
  static safe(u :User) :SafeUser{
    return {
      uid: u.uid,
      username: u.username,
      isAdministrator: !!u.isAdministrator,
      isDefaultUser: u.isDefaultUser ?? true,
    };
  }
}
