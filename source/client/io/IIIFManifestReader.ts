/**
 * 3D Foundation Project
 * Copyright 2025 Smithsonian Institution
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

import { Manifest, Scene, TranslateTransform, RotateTransform, ScaleTransform, SpecificResource, parseManifest, loadManifest } from "@iiif/3d-manifesto-dev";

import math from "@ff/three/math";
import CVModel2 from "client/components/CVModel2";
import CTransform from "@ff/scene/components/CTransform";
import NVNode from "client/nodes/NVNode";
import CVPointLight from "client/components/lights/CVPointLight";
import CVDirectionalLight from "client/components/lights/CVDirectionalLight";
import CVSpotLight from "client/components/lights/CVSpotLight";
import CLight from "@ff/scene/components/CLight";
import { EProjection } from "@ff/three/UniversalCamera";
import CVEnvironmentLight from "client/components/lights/CVEnvironmentLight";
import CVAmbientLight from "client/components/lights/CVAmbientLight";
import { EEasingCurve } from "@ff/core/easing";
import sanitizeHtml from 'sanitize-html';
import { Matrix4, Vector3, Euler, Mesh, MeshStandardMaterial, BufferGeometry, BufferAttribute, DoubleSide, Color } from "three";
import ExplorerApplication from "client/applications/ExplorerApplication";
import CVDocumentProvider from "client/components/CVDocumentProvider";
import CVScene from "client/components/CVScene";
import Annotation from "client/models/Annotation";
import { DEFAULT_LANGUAGE, ELanguageType, EUnitType } from "client/schema/common";
import CVAnnotationView from "client/components/CVAnnotationView";
import CVAssetReader from "client/components/CVAssetReader";
import Document from "@ff/core/Document";

////////////////////////////////////////////////////////////////////////////////

const _mat4a = new Matrix4();
const _mat4b = new Matrix4();
const _vec3a = new Vector3();
const _vec3b = new Vector3();
const _euler = new Euler();
const _color = new Color();
const _upVector = new Vector3(0,1,0);

export default class IIIFManifestReader {
    application: ExplorerApplication = null;

    constructor(application: ExplorerApplication) {
      this.application = application;
    }

    // load IIIF manifest
    loadIIIFManifest(data: any)
    {
        const app = this.application;
        const models: CVModel2[] = [];
        console.log("LOADING IIIF MANIFEST");
        const docProvider = app.system.getMainComponent(CVDocumentProvider);
        const assetReader = app.system.getMainComponent(CVAssetReader);
        const activeDoc = docProvider.activeComponent;
        const iiifManifest = new IIIFManifest(data);
        let manifestJson = null;

        const cvScene = activeDoc.getInnerComponent(CVScene);
        const setup = activeDoc.setup;

        iiifManifest.loadManifest().then(() => {
        const scenes = iiifManifest.scenes;

        // import and set titles
        const titles = activeDoc.meta.collection.get("titles");
        iiifManifest.manifest.getLabel().forEach(label => {
            titles[label._locale.substring(0,2).toUpperCase()] = label._value;
        });
        activeDoc.ins.title.setValue(titles[ELanguageType[setup.language.outs.activeLanguage.value]]);

        // add summary metadata
        activeDoc.meta.collection.insert(iiifManifest.manifest.getSummary().getValue(), "IIIFManifestSummary");

        scenes.forEach(scene => {
            const iiifModels = [];
            const iiifCameras = [];
            const iiifLights = [];
            const iiifComments = [];
            const iiifCanvases = [];
            const iiifAudio = [];
            let narrativeCaption = null;

            // Set scene name
            cvScene.node.name = scene.getLabel().getValue() ?? "Scene";

            const bgColor = scene.getBackgroundColor() as any;      
            if(bgColor) {
                app.setBackgroundStyle("solid");
                app.setBackgroundColor("rgb("+bgColor.red+","+bgColor.green+","+bgColor.blue+")");
            }

            const annos = iiifManifest.annotationsFromScene(scene);

            annos.forEach((anno) => {
                const obj = anno.getBody()[0];
                const body = obj.isSpecificResource() ? obj.getSource() : obj;
                
                const type = (body as any).getType();
                switch(type) {
                    case "model":
                        iiifModels.push(anno);
                        break;
                    case "perspectivecamera":
                    case "orthographiccamera":
                        iiifCameras.push(anno);
                        break;
                    case "directionallight":
                    case "spotlight":
                    case "pointlight":
                    case "ambientlight":
                        iiifLights.push(anno);
                        break;
                    case "textualbody":
                        iiifComments.push(anno);
                        break;
                    case "canvas":
                        iiifCanvases.push(anno);
                        break;
                    case "sound":
                        iiifAudio.push(anno);
                        break;
                    case "text":
                        if((body as any).isSoundCaption) {
                            narrativeCaption = anno;
                        }
                        break;
                    default:
                        console.log("Unsupported IIIF annotation type: "+type);
                }
            });

            // handle models
            iiifModels.forEach((annotation) => {
                const model = annotation.getBody()[0];
                
                const newModel = activeDoc.appendModel(model.isSpecificResource() ? model.getSource()?.id : model.id);
                models.push(newModel);
                newModel.ins.localUnits.setValue(EUnitType.mm);

                const modelLabel = model.getLabelFromSelfOrSource().getValue();
                newModel.node.name = modelLabel ?? "Model";
                newModel.ins.name.setValue(newModel.node.name);

                newModel.setFromMatrix(this.getIIIFBodyTransform(model,annotation));
            });

            // handle lights
            if(iiifLights.length > 0) {
                setup.navigation.ins.lightsFollowCamera.setValue(false);
                // clear default lights
                const lights = activeDoc.innerGraph.findNodeByName("Lights");
                const defaultLights = lights.getComponent(CTransform).children.slice();
                while(defaultLights.length > 0) {
                    const light = defaultLights.pop();
                    light.hasComponent(CVEnvironmentLight) ? light.getComponent(CVEnvironmentLight).ins.enabled.setValue(false) :
                        light.dispose();
                }

                iiifLights.forEach((light) => {
                    const lightBody = light.getBody()[0];
                    const lightLabel = lightBody.getLabelFromSelfOrSource().getValue();
                    let newLight = null;
                    const lightNode = activeDoc.innerGraph.createCustomNode(NVNode);
                    lights.getComponent(CTransform).addChild(lightNode.transform);
                    
                    if(lightBody.isPointLight()) {  
                        newLight = lightNode.createComponent(CVPointLight);
                    }
                    else if(lightBody.isDirectionalLight()) {
                        newLight = lightNode.createComponent(CVDirectionalLight);
                    }
                    else if(lightBody.isSpotLight()) {
                        newLight = lightNode.createComponent(CVSpotLight);
                        (newLight as CVSpotLight).ins.angle.setValue(lightBody.getAngle() || math.PI/3.0);
                    }
                    else if(lightBody.isAmbientLight()) {
                        newLight = lightNode.createComponent(CVAmbientLight);
                    }

                    if(newLight) {
                        // Set properties
                        lightNode.name = lightLabel ?? newLight.typeName;
                        (newLight as CLight).ins.name.setValue(lightNode.name);
                        (newLight as CLight).ins.intensity.setValue(lightBody.getIntensity());
                        const lightColor = lightBody.getColor().value;
                        (newLight as CLight).ins.color.setValue([lightColor[0]/255,lightColor[1]/255,lightColor[2]/255]);

                        // Handle transform
                        const transform = this.getIIIFBodyTransform(lightBody, light);
                        _vec3a.setFromMatrixPosition(transform);
                        newLight.transform.object3D.matrix.copy(transform);
                        const lookAtTransform = this.getIIIFLookAtTransform(lightBody, scene, _vec3a, _upVector);
                        if(lookAtTransform) {        
                            newLight.transform.object3D.matrix.multiply(lookAtTransform);
                        
                            // lookAt orients z-axis, so need to compensate for lights
                            newLight.transform.object3D.matrix.multiply(_mat4a.makeRotationX(90*math.DEG2RAD));
                        }
                        newLight.transform.setPropertiesFromMatrix();
                    }
                    else {
                        console.warn("Unhandled IIIF light type: "+lightBody.getType());
                    }
                });
            }

            // only handle one camera for now
            if(iiifCameras.length > 0) {
                const camera = iiifCameras[0];
                const vCamera = cvScene.cameras[0];
                const orbitNavIns = setup.navigation.ins;
                orbitNavIns.autoZoom.setValue(false);
                orbitNavIns.minOffset.setValue([-Infinity,-Infinity,-Infinity]);

                const cameraBody = camera.getBody()[0];

                // set name
                const cameraLabel = cameraBody.getLabelFromSelfOrSource().getValue();
                vCamera.node.name = cameraLabel ?? "Camera";

                _mat4b.copy(this.getIIIFBodyTransform(cameraBody, camera));

                _vec3a.setFromMatrixPosition(_mat4b);
                const transform = this.getIIIFLookAtTransform(cameraBody, scene, _vec3a, _upVector);

                _euler.setFromRotationMatrix(transform ? transform : _mat4b, "YXZ");
                _vec3b.setFromEuler(_euler).multiplyScalar(math.RAD2DEG);
                _vec3a.applyMatrix4(_mat4b.makeRotationFromEuler(_euler).invert());

                orbitNavIns.offset.setValue(_vec3a.toArray());
                orbitNavIns.orbit.setValue(_vec3b.toArray());

                // set properties if defined
                const fov = cameraBody.FieldOfView;
                if(fov) {
                    vCamera.ins.fov.setValue(fov);
                }
                const near = cameraBody.Near;
                const far = cameraBody.Far;
                if(near || far) {
                    vCamera.addIns.autoNearFar.setValue(false);
                    near ? vCamera.ins.near.setValue(near) : null;
                    far ? vCamera.ins.far.setValue(far) : null;
                }
                vCamera.ins.projection.setValue(cameraBody.isPerspectiveCamera() ? 
                    EProjection.Perspective : EProjection.Orthographic);
            }

            // only handle one scene-level audio element
            if(iiifAudio.length > 0) {
                const audioBody = iiifAudio[0].getBody();
                audioBody.forEach(option => {
                    const langCode: string = option.getProperty("language")?.toUpperCase() || DEFAULT_LANGUAGE; 

                    const clipId = setup.audio.narrationId = Document.generateId();
                    const clip = {
                        id: clipId,
                        name: "Narration Audio",
                        uris: {},
                        captionUris: {},
                        durations: {}
                    };
                    setup.audio.addAudioClip(clip);
                    const uri: string = option.getProperty("id");
                    clip.uris[langCode] = uri;
                    setup.audio.updateAudioClip(clipId);
                });

                if(narrativeCaption) {
                    narrativeCaption.getBody().forEach(option => {
                        const langCode: string = option.getProperty("language")?.toUpperCase() || DEFAULT_LANGUAGE;

                        if(option.isSoundCaption()) {
                            const clip = setup.audio.getAudioClip(setup.audio.narrationId);

                            if(clip) {
                                clip.captionUris[langCode] = option.getProperty("id");
                            }
                            else {
                                console.warn("Caption file not loaded - no corresponding audio clip.");
                            }
                        }
                    });
                }
            }

            // handle comments
            setup.viewer.ins.annotationsVisible.setValue(iiifComments.length > 0);
            iiifComments.forEach((comment) => {
                const target = comment.getTarget();
                const commentBody = comment.getBody()[0];
                if(target.isSpecificResource) {
                    _vec3a.set(0,0,0);
                    const selector = (target as SpecificResource).getSelector();

                    const annotation = new Annotation(undefined);

                    const data = annotation.data;

                    // position
                    if (selector && selector.isPointSelector) {
                        const position = selector.Location;
                        data.position = [position.x, position.y, position.z];
                        _vec3a.fromArray(data.position);
                    }

                    // direction
                    const endPosition = commentBody.Position;
                    if(endPosition) {
                        const labelSelector = (endPosition as SpecificResource).getSelector();
                        const labelPos = labelSelector.Location;
                        _vec3b.set(labelPos.x, labelPos.y, labelPos.z);
                        const labelDir = _vec3b.sub(_vec3a);
                        data.direction = labelDir.toArray();
                        data.scale = labelDir.length();
                    }
                    else {
                        models[0].localBoundingBox.getCenter(_vec3b);
                        data.direction = _vec3a.sub(_vec3b).toArray();
                        data.scale = 0.001;
                    }

                    // parse annotation audio and text content
                    comment.getBody().forEach(option => {
                        const langCode: string = option.getProperty("language")?.toUpperCase() || DEFAULT_LANGUAGE; 

                        if(option.isSound()) {
                            // Add audio clip
                            const clipId = annotation.data.audioId || Document.generateId();
                            let clip = setup.audio.getAudioClip(clipId);
                            if(clip === undefined) {
                                clip = {
                                    id: clipId,
                                    name: "New Audio Element",
                                    uris: {},
                                    captionUris: {},
                                    durations: {}
                                };
                                setup.audio.addAudioClip(clip);
                                annotation.data.audioId = clipId;
                                data.style = "Extended";
                            }
                            const uri: string = option.getProperty("id");
                            clip.uris[langCode] = uri;
                            setup.audio.updateAudioClip(clipId);
                        }
                        else if(option.isSoundCaption()) {
                            // skip caption processing so all audio is parsed first
                            return;
                        }
                        else {
                            const annoValue: string = option.Value;
                            const newLine = annoValue.indexOf('\n');
                            if(newLine >= 0) {
                                annotation.data.titles[langCode] = sanitizeHtml(annoValue.substring(0,newLine), {allowedTags: []});

                                const leadText = annoValue.substring(newLine+1);

                                // handle image parsing and assignment
                                if(leadText.indexOf("<img") >= 0) {
                                    const safeText = sanitizeHtml(leadText, {allowedTags: ['img']});
                                    let temp = document.createElement('div');
                                    temp.innerHTML = safeText;
                                    const image = temp.getElementsByTagName('img')[0];
                                    annotation.data.imageUri = image.src;
                                    annotation.data.imageAltText[langCode] = image.alt;
                                }

                                annotation.data.leads[langCode] = sanitizeHtml(leadText,
                                    {
                                        allowedTags: [ 'b', 'i', 'em', 'strong', 'a', 'sup', 'sub' ],
                                        allowedAttributes: {
                                          'a': [ 'href', 'target' ]
                                        }
                                    });
                                data.style = "Extended";
                            }
                            else {
                                annotation.data.titles[langCode] = sanitizeHtml(annoValue, {allowedTags: []});
                            }
                          }
                    });

                    // parse audio captions
                    comment.getBody().forEach(option => {
                        const langCode: string = option.getProperty("language")?.toUpperCase() || DEFAULT_LANGUAGE;

                        if(option.isSoundCaption()) {
                            const clip = setup.audio.getAudioClip(annotation.data.audioId);

                            if(clip) {
                                clip.captionUris[langCode] = option.getProperty("id");
                            }
                            else {
                                console.warn("Caption file not loaded - no corresponding audio clip.");
                            }
                        }
                    });
                    
                    // handle scope
                    const scopeAnnotations = comment.ScopeContent;
                    scopeAnnotations.forEach((anno) => {
                        const obj = anno.getBody()[0];
                        const body = obj.isSpecificResource() ? obj.getSource() : obj;
                        
                        const type = (body as any).getType();
                        switch(type) {
                            case "perspectivecamera":
                            case "orthographiccamera":
                                const cameraBody = anno.getBody()[0];
                                _mat4b.copy(this.getIIIFBodyTransform(cameraBody, anno));

                                _vec3a.setFromMatrixPosition(_mat4b);
                                const transform = this.getIIIFLookAtTransform(cameraBody, scene, _vec3a, _upVector);

                                _euler.setFromRotationMatrix(transform ? transform : _mat4b, "YXZ");
                                _vec3b.setFromEuler(_euler).multiplyScalar(math.RAD2DEG);
                                _vec3a.applyMatrix4(_mat4b.makeRotationFromEuler(_euler).invert());

                                // add view to annotation
                                const machine = setup.snapshots;
                                const props = machine.getTargetProperties();
                                const orbitIdx = props.findIndex((elem) => {return elem.name == "Orbit"});
                                const offsetIdx = props.findIndex((elem) => {return elem.name == "Offset"});

                                const values = machine.getCurrentValues();
                                values[offsetIdx] = _vec3a.toArray();
                                values[orbitIdx] = _vec3b.toArray();
                                const id = machine.setState({
                                    values: values,
                                    curve: EEasingCurve.EaseOutQuad,
                                    duration: 1.0,
                                    threshold: 0.5,
                                });
                                annotation.set("viewId", id);
                                break;
                            default:
                                console.log("Unsupported IIIF scope annotation type: "+type);
                        }
                    });


                    const view = models[0].getGraphComponent(CVAnnotationView);
                    view.addAnnotation(annotation);
                }
            });

            // handle canvases
            iiifCanvases.forEach((canvas) => {
                const target = canvas.getTarget();
                if(target.isSpecificResource) {
                    const selector = (target as SpecificResource).__jsonld.selector[0];
                    
                    if(selector.type === "PolygonZSelector") {
                        const polygon = selector.value;
                        const startIdx = polygon.lastIndexOf("(") + 1;
                        const values = polygon.slice(startIdx, polygon.indexOf(")"));
                        const valueArray = values.split(" ");
                        const corners : Vector3[] = [];
                        for(let i=0; i<valueArray.length; i+=3) {
                            corners.push(new Vector3(parseFloat(valueArray[i]), parseFloat(valueArray[i+1]), parseFloat(valueArray[i+2])));
                        }

                        const geometry = new BufferGeometry().setFromPoints(corners);
                        geometry.setIndex([0, 1, 2, 2, 3, 0]);
                        geometry.setAttribute( 'uv', new BufferAttribute( new Float32Array( [0,1,0,0,1,0,1,1] ), 2 ) );
                        geometry.computeVertexNormals();

                        // load image
                        const canvasId = canvas.getBody()[0].id;
                        const canvasObj = iiifManifest.manifest?.getSequences()[0]?.getCanvasById(canvasId);
                        const uri = canvasObj.getCanonicalImageUri();
                        const bgColor = canvasObj.getProperty("backgroundColor");
                        
                        assetReader.getTexture(uri).then(map => {
                            const canvasMesh = new Mesh(
                                geometry,
                                new MeshStandardMaterial({map: map, side: DoubleSide})
                            );
                            cvScene.object3D.add(canvasMesh);

                            // TODO: Get rid of this hack when we can support canvases as scenegraph nodes
                            manifestJson ??= JSON.parse(iiifManifest.manifestJson);
                            canvasMesh.userData["IIIFCanvas"] = manifestJson["items"].find(item => item.id === canvasId);

                            if(bgColor) {
                                _color.set(bgColor);
                                canvasMesh.material.onBeforeCompile = (shader) => {
                                    shader.fragmentShader = shader.fragmentShader.slice(0,shader.fragmentShader.lastIndexOf('}')).concat(
                                        '\n \
                                        if (!gl_FrontFacing) {\n \
                                            gl_FragColor = vec4('
                                        + _color.toArray().toString() + 
                                        ', 1.0);\n \
                                        }\n \
                                        }'
                                    )
                                }
                            }

                            /*const modelNode = activeDoc.innerGraph.createCustomNode(NVNode);
                            cvScene.transform.addChild(modelNode.transform);
                            modelNode.createModel();

                            const model = modelNode.model;
                            model.object3D.add(canvasMesh);
                            //model.registerPickableObject3D(canvasMesh, true);*/
                        });
                    }
                }
            });
        });
      });
      
      setup.ins.saveState.set();
      
      this.application = null;
  }

  private getIIIFBodyTransform(body: any, annotation: any) : Matrix4
  {
      _mat4a.identity();
      if (body.isSpecificResource()) {
          const transforms = (body as SpecificResource).getTransform() || [];

          transforms.forEach((transform) => {
              _mat4b.identity();
              if(transform.isTranslateTransform) {
                  const translation = (transform as TranslateTransform).getTranslation() as any;
                  if (translation) {
                      _vec3a.set(translation.x,translation.y,translation.z);
                      _mat4b.setPosition(_vec3a);
                  }
              }
              else if (transform.isRotateTransform) {
                  const rotation = (transform as RotateTransform).getRotation() as any;
                  _euler.set(rotation.x*math.DEG2RAD,rotation.y*math.DEG2RAD,rotation.z*math.DEG2RAD, "XYZ");
                  _mat4b.makeRotationFromEuler(_euler);
              }
              else if(transform.isScaleTransform) {
                  const scale = (transform as ScaleTransform).getScale() as any;
                  _mat4b.makeScale(scale.x,scale.y,scale.z);
              }
              _mat4a.premultiply(_mat4b);
          });                        
      }

      const target = annotation.getTarget();
      if(target && target.isSpecificResource) {
          const selector = target.getSelector();
          if(selector && selector.isPointSelector) {
              _mat4b.identity();
              _mat4b.setPosition(selector.Location.x, selector.Location.y, selector.Location.z);
              _mat4a.premultiply(_mat4b);
          }
      }

      return _mat4a;
  }

  private getIIIFLookAtTransform(body: any, scene: any, eye: Vector3, up: Vector3) : Matrix4
  {
      _mat4a.identity();
      if (body.LookAt?.isPointSelector) {
          const lookAt = body.LookAt?.Location;

          _mat4a.lookAt(eye,lookAt,up);
          return _mat4a;
      }
      else if(body.LookAt?.id) {
          const anno = scene.getAnnotationById(body.LookAt.id);
          _vec3b.set(anno.LookAtLocation.x,anno.LookAtLocation.y,anno.LookAtLocation.z);

          _mat4a.lookAt(eye,_vec3b,up);
          return _mat4a;
      }
      return null;
  }
}

// Adapted from https://github.com/JulieWinchester/iiif-threejs-demo/blob/main/src/iiif.js
class IIIFManifest {

    manifestJson: string = null;
    manifestUrl: string = null;
    manifest: Manifest = null;
    scenes: Scene[] = null;

    constructor(manifest) {
      // Is manifest JSON or URL?
      if (isJsonString(manifest)) {
        this.manifestJson = manifest;
        this.manifestUrl = null;
        this.manifest = parseManifest(manifest) as Manifest;
      } else {
        this.manifestJson = null;
        this.manifestUrl = manifest;
      }
    }

    async loadManifest() {
      if (this.manifestUrl)
        this.manifestJson = await loadManifest(this.manifestUrl);

      if (this.manifestJson)
        this.manifest = await parseManifest(this.manifestJson) as Manifest;

      if (this.manifest)
        this.scenes = this.manifest?.getSequences()[0]?.getScenes() || [];
    }

    annotationsFromScene(scene: Scene) {
      return scene?.getContent().concat(scene?.getNonContentAnnotations()) || [];
    }
  }

  function isJsonString(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }