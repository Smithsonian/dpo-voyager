

let url = "http://localhost:8000";
let opts = {
  headers: {
    "Content-Type": "application/json", 
    "Accept": "application/json",
    "Cookie": "session=eyJ1c2VybmFtZSI6InNkdW1ldHoiLCJ1aWQiOjE5NDAzNjgwMDk1ODI4OCwiaXNEZWZhdWx0VXNlciI6ZmFsc2UsImlzQWRtaW5pc3RyYXRvciI6dHJ1ZX0=; session.sig=jmo5PaNHgv87gYKkk7Zkmk6gMvw"
  },
}



fetch(`${url}/api/v1/scenes`, opts).then(async r=>{
  if(! r.ok) throw new Error(`GET scenes [${r.status}] ${r.statusText}`);
  let scenes = await r.json();

  for(let scene of scenes){
    let docUrl = `${url}/scenes/${scene.name}/scene.svx.json`;
    let docRes = await fetch(docUrl, opts);
    if(! docRes.ok) throw new Error(`GET scene ${scene.name} [${docRes.status}] ${docRes.statusText}`);
    let doc = await docRes.json();
    let {annotationCategories, eTData, nodes, models, ...rest} = doc;
    console.log("Categories : ", annotationCategories);
    let modified =  new Set();
    if(annotationCategories || eTData) modified.add("root")
    nodes = nodes.map(({annotationCategories, ...node})=>{
      return node
    });
    for(let model of models){
      if(model.annotationsBoxes){
        modified.add("annotationBoxes");
        delete model.annotationsBoxes;
      }
      for(let annotation of model.annotations ?? []){
        if(annotation.categories){
          modified.add("annotationCategories");
          delete annotation.categories;
        }
        if(annotation.children){
          modified.add("annotationChildren");
          delete annotation.children;
        }
        if(annotation.parent){
          modified.add("annotationChildren");
          delete annotation.parent;
        }
      }
    }
    if(modified.size == 0) continue;

    console.log("Scene %s has changes on :", scene.name, Array.from(modified.keys()).join(", "));
    let result = await fetch(docUrl, {...opts, method: "PUT", body: JSON.stringify({
      ...rest,
      nodes,
      models,
    })});
    if(!result.ok) throw new Error(`PUT scene ${scene.name} [${result.status}] ${result.statusText}`);
  }
})