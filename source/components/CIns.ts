/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Component from "../Component";
import Property, { IPropertySchema } from "../Property";

////////////////////////////////////////////////////////////////////////////////

export default class CIns extends Component
{
    static readonly typeName: string = "CIns";

    protected customOuts: Property[] = [];

    update(context)
    {
        const outerComponent = this.graph.parent;
        if (outerComponent) {
            const outerIns = outerComponent.ins;
            const innerOuts = this.customOuts;

            for (let i = 0, n = innerOuts.length; i < n; ++i) {
                const output = innerOuts[i];
                const input = outerIns[output.key];
                if (input.changed) {
                    output.setValue(input.value);
                }
            }
        }

        return true;
    }

    addCustomOutput(path: string, schema: IPropertySchema, index?: number)
    {
        const property = super.addCustomOutput(path, schema, index);
        this.graph.parent.ins.createProperty(path, schema, property.key, index);
        this.customOuts = this.outs.customProperties;
        return property;
    }

    allowCustomOutput(schema: IPropertySchema): boolean
    {
        return !!this.graph.parent;
    }

    fromJSON(json: any)
    {
        super.fromJSON(json);

        const outerComponent = this.graph.parent;
        if (outerComponent) {
            this.customOuts = this.outs.customProperties;
            this.customOuts.forEach(property => {
                outerComponent.ins.createProperty(property.path, property.schema, property.key);
            });
        }
    }
}