
import path from "path";
import {open as openDatabase, Database as IDatabase } from "sqlite";
import sqlite from "sqlite3";

export interface DbOptions {
  filename:string;
  migrate ?:boolean|"force";
}

interface TransactionWork<T>{
  (db :Transaction) :Promise<T>;
}
export interface Database extends IDatabase{
  /**
   * opens a new connection to the database to perform a transaction
   */
  beginTransaction :(<T>(work :TransactionWork<T>, commit ?:boolean)=>Promise<T>);
}
export interface Transaction extends Database{}

export default async function open({filename, migrate=true} :DbOptions) :Promise<Database> {
  let db = await openDatabase({
    filename,
    driver: sqlite.Database, 
    mode: sqlite.OPEN_URI|sqlite.OPEN_CREATE|sqlite.OPEN_READWRITE,
  });
  await db.run(`PRAGMA journal_mode = WAL`);
  await db.run(`PRAGMA synchronous = NORMAL`);

  if(migrate !== false){
    await db.migrate({
      force: ((migrate === "force")?true: false),
      migrationsPath: path.resolve(__dirname, "../../migrations"),
    });
  }
  (db as Database).beginTransaction = async function(work :TransactionWork<any>, commit :boolean = true){
    let conn = await openDatabase(db.config) as Transaction;
    conn.beginTransaction = async function(work :TransactionWork<any>){
      return await work(conn);
    }
    if(commit) await conn.run(`BEGIN TRANSACTION`);
    try{
      let res = await work(conn);
      if(commit) await conn.run("END TRANSACTION");
      return res;
    }finally{
      //Close will automatically rollback the transaction if it wasn't committed
      await conn.close();
    }
  };
  return db as Database;
}
