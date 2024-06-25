/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { BufferGeometry, Mesh, Material, MeshBasicMaterial } from "three";

import { types } from "@ff/graph/Component";

import CTransform from "./CTransform";
import CObject3D from "./CObject3D";
import CGeometry from "./CGeometry";
import CMaterial from "./CMaterial";

////////////////////////////////////////////////////////////////////////////////

export default class CMesh extends CObject3D
{
    static readonly typeName: string = "CMesh";

    static readonly meshIns = Object.assign({}, CTransform.transformIns, {
        geometry: types.Object("Mesh.Geometry", CGeometry),
        material: types.Object("Mesh.Material", CMaterial),
        castShadow: types.Boolean("Shadow.Cast"),
        receiveShadow: types.Boolean("Shadow.Receive"),
    });

    ins = this.addInputs<CObject3D, typeof CMesh["meshIns"]>(CMesh.meshIns);

    protected static dummyGeometry = new BufferGeometry();
    protected static dummyMaterial = new MeshBasicMaterial();

    protected geometryComponent: CGeometry = null;
    protected materialComponent: CMaterial = null;

    get mesh() {
        return this.object3D as Mesh;
    }

    create()
    {
        this.object3D = new Mesh(CMesh.dummyGeometry, CMesh.dummyMaterial);
        this.object3D.castShadow = true;

        this.trackComponent(CGeometry, component => {
            if (!this.geometryComponent) {
                this.geometryComponent = component;
                component.on("update", this.updateGeometry, this);
            }
        }, component => {
            if (this.geometryComponent === component) {
                this.geometryComponent = null;
                component.off("update", this.updateGeometry, this);
            }
        });

        this.trackComponent(CMaterial, component => {
            if (!this.materialComponent) {
                this.materialComponent = component;
                component.on("update", this.updateMaterial, this);
            }
        }, component => {
            if (this.materialComponent === component) {
                this.materialComponent = null;
                component.off("update", this.updateMaterial, this);
            }
        });

        super.create();
    }

    update(context)
    {
        super.update(context);
        super.updateTransform();

        const ins = this.ins;

        if (ins.geometry.changed) {
            this.updateGeometry(ins.geometry.value);
        }
        if (ins.material.changed) {
            this.updateMaterial(ins.material.value);
        }
        if (ins.castShadow.changed) {
            this.object3D.castShadow = ins.castShadow.value;
        }
        if (ins.receiveShadow.changed) {
            this.object3D.receiveShadow = ins.receiveShadow.value;
        }

        return true;
    }

    toString()
    {
        const geo = this.mesh.geometry;
        const mat = this.mesh.material as Material;
        return `${this.typeName} - Geometry: '${geo ? geo.type : "N/A"}', Material: '${mat ? mat.type : "N/A"}'`
    }

    protected updateGeometry(component: CGeometry | undefined)
    {
        component = component || this.geometryComponent;
        const geometry = component ? component.geometry : undefined;
        this.mesh.geometry = geometry || CMesh.dummyGeometry;
    }

    protected updateMaterial(component: CMaterial | undefined)
    {
        component = component || this.materialComponent;
        const material = component ? component.material : undefined;
        this.mesh.material = material || CMesh.dummyMaterial;
    }
}