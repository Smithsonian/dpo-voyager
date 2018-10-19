/**
 * 3D Foundation Project
 * Copyright 2018 Smithsonian Institution
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

import { ReturnType } from "@ff/core/types";

import Commander from "@ff/core/Commander";
import Component from "@ff/core/ecs/Component";

////////////////////////////////////////////////////////////////////////////////

export { Commander };

export type Actions<T extends Controller<any>> = ReturnType<T["createActions"]>;

export default class Controller<T extends Controller<any> = Controller<any>> extends Component
{
    static readonly type: string = "Controller";

    actions: Actions<T> = null;

    createActions(commander: Commander)
    {
    }
}