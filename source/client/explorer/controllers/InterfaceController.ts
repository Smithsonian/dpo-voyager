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

import Controller, { Actions, ITypedEvent } from "@ff/core/Controller";
import Commander from "@ff/core/Commander";
import ExplorerSystem from "../ExplorerSystem";

////////////////////////////////////////////////////////////////////////////////

export interface IInterfaceUpdateEvent extends ITypedEvent<"update">
{
}

type InterfaceActions = Actions<InterfaceController>;

export default class InterfaceController extends Controller<InterfaceController>
{
    readonly system: ExplorerSystem;

    private _visible: boolean;
    private _logo: boolean;

    constructor(system: ExplorerSystem, commander: Commander)
    {
        super(commander);
        this.addEvent("update");
    }

    createActions(commander: Commander)
    {
        return {};
    }

    get visible() {
        return this._visible;
    }

    set visible(visible: boolean) {
        this._visible = visible;
        this.emit<IInterfaceUpdateEvent>({ type: "update" });
    }

    get logo() {
        return this._logo;
    }

    set logo(logo: boolean) {
        this._logo = logo;
        this.emit<IInterfaceUpdateEvent>({ type: "update" });
    }
}