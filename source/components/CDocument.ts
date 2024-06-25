/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { types } from "../Component";

import CGraph from "./CGraph";

////////////////////////////////////////////////////////////////////////////////

export default class CDocument extends CGraph
{
    static readonly typeName: string = "CDocument";

    protected static readonly docIns = {
        dump: types.Event("Document.Dump"),
    };


    ins = this.addInputs<CGraph, typeof CDocument.docIns>(CDocument.docIns);

    update(context)
    {
        const ins = this.ins;

        if (ins.dump.changed) {
            const json = this.toJSON();
            console.log("-------------------- DOCUMENT --------------------");
            console.log(JSON.stringify(json, null, 2));
        }

        return true;
    }
}