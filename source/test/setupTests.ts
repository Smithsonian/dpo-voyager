import path from "path";
import * as moduleAlias from "module-alias";


global["ENV_DEVELOPMENT"] = false;

const buildDir = path.resolve(__dirname, "../..");

moduleAlias.addAliases({
  "@ff/browser": path.join(buildDir, "libs/ff-browser/source"),
  "@ff/core": path.join(buildDir, "libs/ff-core/source"),
  "@ff/graph": path.join(buildDir, "libs/ff-graph/source"),
  "@ff/scene": path.join(buildDir, "libs/ff-scene/source"),
  "@ff/three": path.join(buildDir, "libs/ff-three/source"),
  "@ff/ui": path.join(buildDir, "libs/ff-ui/source"),
  "client": path.join(buildDir, "source/client")
});