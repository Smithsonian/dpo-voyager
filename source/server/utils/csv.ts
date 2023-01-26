


export default function toCsv<T extends Object>(history :T[], sep=";") :string{
  let columns = Object.keys(history[0]);
  let lines :string[] = [];
    lines.push(columns.join(sep));
  for(let row of history){
    lines.push(columns.map(c=>(row as any)[c].toString()|| "").join(sep));
  }
  return lines.join("\n")+"\n";
}