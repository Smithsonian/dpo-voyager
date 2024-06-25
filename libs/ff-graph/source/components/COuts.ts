/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Component from "../Component";
import Property, { IPropertySchema } from "../Property";

////////////////////////////////////////////////////////////////////////////////

export default class COuts extends Component
{
    static readonly typeName: string = "COuts";

    protected customIns: Property[] = [];

    update(context)
    {
        const outerComponent = this.graph.parent;
        if (outerComponent) {
            const innerIns = this.customIns;
            const outerOuts = outerComponent.outs;

            for (let i = 0, n = innerIns.length; i < n; ++i) {
                const input = innerIns[i];
                if (input.changed) {
                    outerOuts[input.key].setValue(input.value);
                }
            }
        }

        return true;
    }

    addCustomInput(path: string, schema: IPropertySchema, index?: number)
    {
        const property = super.addCustomInput(path, schema, index);
        this.graph.parent.outs.createProperty(path, schema, property.key, index);
        this.customIns = this.ins.customProperties;
        return property;
    }

    allowCustomInput(schema: IPropertySchema): boolean
    {
        return !!this.graph.parent;
    }

    fromJSON(json: any)
    {
        super.fromJSON(json);

        const outerComponent = this.graph.parent;
        if (outerComponent) {
            this.customIns = this.ins.customProperties;
            this.customIns.forEach(property => {
                outerComponent.outs.createProperty(property.path, property.schema, property.key);
            });
        }
    }
}