import { expect } from "chai";
import { Box3, Matrix4, Vector3 } from "three";

import CameraController, { EControllerMode } from "@ff/three/CameraController";
import UniversalCamera, { EProjection } from "@ff/three/UniversalCamera";
import threeMath from "@ff/three/math";


function createController(orbit: number[], offset: number[], pivot = [0, 0, 0], projection = EProjection.Perspective)
{
  const camera = new UniversalCamera(projection);
  camera.matrixAutoUpdate = false;
  const controller = new CameraController(camera);
  controller.orbit.fromArray(orbit);
  controller.offset.fromArray(offset);
  controller.pivot.fromArray(pivot);
  controller.maxOffset.set(Infinity, Infinity, 1000);
  update(controller);
  return { camera, controller };
}

function update(controller: CameraController)
{
  controller.updateCamera(null, true);
  controller.camera.updateMatrixWorld(true);
}

function legacyMatrix(orbit: number[], offset: number[])
{
  const rad = new Vector3().fromArray(orbit).multiplyScalar(threeMath.DEG2RAD);
  return threeMath.composeOrbitMatrix(rad, new Vector3().fromArray(offset), new Matrix4());
}

function cameraPosition(camera: UniversalCamera)
{
  return new Vector3().setFromMatrixPosition(camera.matrixWorld);
}

/** Target position expressed in camera space */
function inCameraSpace(camera: UniversalCamera, target: Vector3)
{
  return target.clone().applyMatrix4(camera.matrixWorld.clone().invert());
}

function expectMatrixClose(actual: Matrix4, expected: Matrix4)
{
  actual.elements.forEach((v, i) => expect(v).to.be.closeTo(expected.elements[i], 1e-6));
}


describe("CameraController", function(){

  describe("updateCamera()", function(){
    it("matches the legacy orbit matrix when pivot is at the origin", function(){
      const orbit = [ -25, -40, 30 ], offset = [ 3, -2, 100 ];
      const { camera } = createController(orbit, offset);
      expectMatrixClose(camera.matrix, legacyMatrix(orbit, offset));
    });

    it("translates the orbit matrix by the pivot", function(){
      const orbit = [ -25, -40, 30 ], offset = [ 3, -2, 100 ];
      const { camera } = createController(orbit, offset, [ 10, 5, -7 ]);
      const expected = legacyMatrix(orbit, offset).premultiply(new Matrix4().makeTranslation(10, 5, -7));
      expectMatrixClose(camera.matrix, expected);
    });

    it("keeps orthographic cameras at maxOffset.z from the pivot", function(){
      const { camera } = createController([ 0, 0, 0 ], [ 0, 0, 5 ], [ 1, 2, 3 ], EProjection.Orthographic);
      expect(cameraPosition(camera).toArray()).to.deep.equal([ 1, 2, 1003 ]);
      expect(camera.size).to.equal(5);
    });
  });

  describe("updateController()", function(){
    it("is the inverse of updateCamera()", function(){
      const { camera, controller } = createController([ -20, 30, 10 ], [ 4, -3, 50 ], [ 10, 5, -7 ]);
      const matrix = camera.matrix.clone();
      controller.orbit.set(0, 0, 0);
      controller.offset.set(0, 0, 0);
      controller.updateController();
      expect(controller.orbit.x).to.be.closeTo(-20, 1e-6);
      expect(controller.orbit.y).to.be.closeTo(30, 1e-6);
      expect(controller.orbit.z).to.be.closeTo(10, 1e-6);
      update(controller);
      expectMatrixClose(camera.matrix, matrix);
    });
  });

  describe("setPivot()", function(){
    [ 0, 30 ].forEach(roll => {
      it(`keeps the camera in place and faces the new pivot (roll = ${roll})`, function(){
        const { camera, controller } = createController([ -20, 30, roll ], [ 4, -3, 50 ], [ 10, 5, -7 ]);
        const before = cameraPosition(camera);
        const target = new Vector3(-3, 8, 2);

        controller.setPivot(target);
        update(controller);

        expect(cameraPosition(camera).distanceTo(before)).to.be.closeTo(0, 1e-6);
        expect(controller.orbit.z).to.equal(roll);
        expect(controller.offset.toArray()).to.deep.equal([ 0, 0, before.distanceTo(target) ]);
        const local = inCameraSpace(camera, target);
        expect(local.x).to.be.closeTo(0, 1e-6);
        expect(local.y).to.be.closeTo(0, 1e-6);
        expect(local.z).to.be.below(0);
      });
    });

    it("keeps heading on the current turn", function(){
      const { controller } = createController([ -20, 750, 0 ], [ 0, 0, 50 ]);
      controller.setPivot(new Vector3(1, 0, 0));
      expect(controller.orbit.y).to.be.within(750 - 180, 750 + 180);
    });

    it("respects limits", function(){
      const { controller } = createController([ 0, 0, 0 ], [ 0, 0, 50 ]);
      controller.minOrbit.x = -10;
      controller.maxOffset.z = 20;
      // camera is at (0, 0, 50), target is far below it
      controller.setPivot(new Vector3(0, -100, 0));
      expect(controller.orbit.x).to.equal(-10);
      expect(controller.offset.z).to.equal(20);
    });
  });

  describe("zoomExtents()", function(){
    it("centers the box on screen", function(){
      const { camera, controller } = createController([ -20, 30, 0 ], [ 0, 0, 50 ], [ 10, 5, -7 ]);
      const center = new Vector3(2, 3, 4);
      const box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1)).translate(center);

      controller.zoomExtents(box);
      update(controller);

      const local = inCameraSpace(camera, center);
      expect(local.x).to.be.closeTo(0, 1e-6);
      expect(local.y).to.be.closeTo(0, 1e-6);
      expect(local.z).to.be.below(0);
    });
  });

  describe("Fly and Walk modes", function(){
    [ EControllerMode.Fly, EControllerMode.Walk ].forEach(mode => {
      [ 0, 30 ].forEach(roll => {
        it(`${EControllerMode[mode]} rotation keeps the camera in place with a pivot (roll = ${roll})`, function(){
          const { camera, controller } = createController([ -20, 30, roll ], [ 4, -3, 50 ], [ 10, 5, -7 ]);
          controller.controllerMode = mode;
          controller.boundsRadius = 10;
          const before = cameraPosition(camera);

          controller["updatePose"](0, 0, 0, 15, 25, 0);
          update(controller);

          expect(cameraPosition(camera).distanceTo(before)).to.be.closeTo(0, 1e-6);
        });
      });
    });
  });
});
