

let cookie = [...process.argv].pop();
if(!cookie || !cookie.startsWith("session=")) throw new Error`Provide an authorization cookie for this script to work`;

let url = "http://localhost:8000";
let opts = {
  headers: {
    "Content-Type": "application/json", 
    "Accept": "application/json",
    "Cookie": cookie,
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
    let {annotationCategories, eTData, nodes, models, setups, ...rest} = doc;
    let modified =  new Set();
    if(annotationCategories || eTData) modified.add("root")
    nodes = nodes.map(({annotationCategories, ...node})=>{
      return node
    });

    //Clean models of unwanted metadata
    for(let model of models){
      if(model.annotationsBoxes){
        modified.add("annotationBoxes");
        delete model.annotationsBoxes;
      }
      if(model.annotations){
        //Remove child annotations (unsupported)
        model.annotations = model.annotations?.filter(a=>!a.parent);
        for(let annotation of model.annotations){
          if(annotation.categories){
            modified.add("annotationCategories");
            delete annotation.categories;
          }
          if(annotation.children){
            modified.add("annotationChildren");
            delete annotation.children;
          }
        }
      }
    }

    //Clean setup of bad tours configuration
    for(let {snapshots} of setups){
      if(!snapshots) continue;
      let idx = snapshots.targets.findIndex(s=> s.indexOf("/setup/navigation/orbit") !== -1);
      if(idx == -1){
        console.warn(`No orbit param for a tour in ${scene.name}`);
        continue;
      }
      for(let state of (snapshots.states ?? [])){
        let orbit = state.values[idx];
        for(let [index, a] of orbit.entries()){
          orbit[index] = a % 360;
          if(a !== orbit[index]) modified.add("angles");
        }
      }
    }

    if(modified.size == 0) continue;

    console.log("Scene %s has changes on :", scene.name, Array.from(modified.keys()).join(", "));
    let result = await fetch(docUrl, {...opts, method: "PUT", body: JSON.stringify({
      ...rest,
      nodes,
      models,
      setups,
    })});
    if(!result.ok) throw new Error(`PUT scene ${scene.name} [${result.status}] ${result.statusText}`);
  }
})