/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import createServer from "./server";

//@ts-ignore
import("source-map-support").then((s)=>{
    s.install();
}, (e)=>console.log("Source maps not supported"));



////////////////////////////////////////////////////////////////////////////////
// CONFIGURATION

const port: number = parseInt(process.env["VOYAGER_SERVER_PORT"]|| "8000") ;
const devMode: boolean = process.env["NODE_ENV"] !== "production";

const rootDir = process.cwd();

(async ()=>{
    console.info("Serve directory : "+rootDir);
    const app = await createServer(rootDir, {verbose:devMode});
    
    app.listen(port, () => {
        console.info(`Server ready and listening on port ${port}\n`);
        app.locals.port = port;
    });
})();
