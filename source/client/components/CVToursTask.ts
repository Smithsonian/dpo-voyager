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

import CVTask from "./CVTask";
import ToursTaskView from "../ui/story/ToursTaskView";

////////////////////////////////////////////////////////////////////////////////

export default class CVToursTask extends CVTask
{
    static readonly typeName: string = "CVToursTask";

    static readonly text: string = "Tours";
    static readonly icon: string = "globe";

    createView()
    {
        return new ToursTaskView(this);
    }
}