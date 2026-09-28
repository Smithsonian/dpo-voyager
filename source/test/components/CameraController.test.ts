import { expect } from "chai";
import { Box3, Matrix4, Quaternion, Vector3 } from "three";

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

  describe("getCameraPosition() and getViewDirection()", function(){
    it("match the camera matrix", function(){
      const { camera, controller } = createController([ -20, 30, 10 ], [ 4, -3, 50 ], [ 10, 5, -7 ]);
      const position = controller.getCameraPosition(new Vector3());
      const direction = controller.getViewDirection(new Vector3());
      expect(position.distanceTo(cameraPosition(camera))).to.be.closeTo(0, 1e-6);
      const expected = new Vector3(0, 0, -1).transformDirection(camera.matrixWorld);
      expect(direction.distanceTo(expected)).to.be.closeTo(0, 1e-6);
    });
  });

  describe("turning towards a new pivot", function(){
    // same steps as CVOrbitNavigation's pivot animation
    it("keeps the camera in place and ends facing the pivot", function(){
      const { camera, controller } = createController([ -20, 30, 10 ], [ 4, -3, 50 ], [ 10, 5, -7 ]);
      const pivot = new Vector3(-3, 8, 2);
      const position = controller.getCameraPosition(new Vector3());
      const from = controller.getViewDirection(new Vector3());
      const to = pivot.clone().sub(position);
      const distance = to.length();
      to.normalize();
      const rotation = new Quaternion().setFromUnitVectors(from, to);

      let previousAngle = from.angleTo(to);
      for (const t of [ 0.1, 0.25, 0.5, 0.75, 0.9 ]) {
        const q = new Quaternion().slerpQuaternions(new Quaternion(), rotation, t);
        controller.setPivot(from.clone().applyQuaternion(q).multiplyScalar(distance).add(position));
        update(controller);

        expect(cameraPosition(camera).distanceTo(position)).to.be.closeTo(0, 1e-6);
        const angle = controller.getViewDirection(new Vector3()).angleTo(to);
        expect(angle).to.be.below(previousAngle);
        previousAngle = angle;
      }

      controller.setPivot(pivot);
      update(controller);
      const local = inCameraSpace(camera, pivot);
      expect(local.x).to.be.closeTo(0, 1e-6);
      expect(local.y).to.be.closeTo(0, 1e-6);
      expect(controller.pivot.toArray()).to.deep.equal(pivot.toArray());
    });
  });

  describe("getViewDepth()", function(){
    it("returns the distance along the view axis", function(){
      const { camera, controller } = createController([ -20, 30, 10 ], [ 4, -3, 50 ], [ 10, 5, -7 ]);
      const inFront = new Vector3(0, 0, -12).applyMatrix4(camera.matrixWorld);
      const behind = new Vector3(3, 1, 5).applyMatrix4(camera.matrixWorld);
      expect(controller.getViewDepth(inFront)).to.be.closeTo(12, 1e-6);
      expect(controller.getViewDepth(behind)).to.be.closeTo(-5, 1e-6);
    });
  });

  describe("setPivotDistance()", function(){
    it("moves the pivot on the view axis, keeping the camera in place", function(){
      const { camera, controller } = createController([ -20, 30, 10 ], [ 4, -3, 50 ], [ 10, 5, -7 ]);
      const matrix = camera.matrix.clone();
      const target = new Vector3(0, 0, -12).applyMatrix4(camera.matrixWorld);

      controller.setPivotDistance(12);
      update(controller);

      expectMatrixClose(camera.matrix, matrix);
      expect(controller.offset.toArray()).to.deep.equal([ 0, 0, 12 ]);
      expect(controller.pivot.distanceTo(target)).to.be.closeTo(0, 1e-6);
    });

    it("clamps the distance to the offset limits", function(){
      const { controller } = createController([ 0, 0, 0 ], [ 0, 0, 50 ]);
      controller.minOffset.z = 1;
      controller.setPivotDistance(0.01);
      expect(controller.offset.z).to.equal(1);
    });

    it("re-anchors after flying around", function(){
      const { camera, controller } = createController([ -20, 30, 10 ], [ 0, 0, 50 ], [ 10, 5, -7 ]);
      controller.controllerMode = EControllerMode.Fly;
      controller.boundsRadius = 10;
      controller["pan"](30, -20);
      controller["dolly"](5);
      controller["rotate"](15, 25, 0);
      update(controller);
      const matrix = camera.matrix.clone();

      controller.controllerMode = EControllerMode.Orbit;
      controller.setPivotDistance(20);
      update(controller);

      expectMatrixClose(camera.matrix, matrix);
      expect(controller.offset.toArray()).to.deep.equal([ 0, 0, 20 ]);
    });
  });

  describe("zoomExtents()", function(){
    it("moves the pivot to the center of the box", function(){
      const { controller } = createController([ -20, 30, 0 ], [ 4, 2, 50 ], [ 10, 5, -7 ]);
      const box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1)).translate(new Vector3(2, 3, 4));
      controller.zoomExtents(box);
      expect(controller.pivot.toArray()).to.deep.equal([ 2, 3, 4 ]);
      expect(controller.offset.x).to.equal(0);
      expect(controller.offset.y).to.equal(0);
      expect(controller.orbit.toArray()).to.deep.equal([ -20, 30, 0 ]);
    });

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

  describe("Orbit pan", function(){
    [ EProjection.Perspective, EProjection.Orthographic ].forEach(projection => {
      it(`moves the pivot with the camera (${EProjection[projection]})`, function(){
        const { camera, controller } = createController([ -20, 30, 10 ], [ 4, -3, 50 ], [ 10, 5, -7 ], projection);
        controller.setViewportSize(100, 100);
        const pivot = controller.pivot.clone();
        const pivotInCamera = inCameraSpace(camera, pivot);
        const before = cameraPosition(camera);

        controller["pan"](30, -20);
        update(controller);

        // camera and pivot move together: the pivot stays in place on screen
        const moved = cameraPosition(camera).sub(before);
        expect(controller.pivot.clone().sub(pivot).distanceTo(moved)).to.be.closeTo(0, 1e-6);
        expect(controller.offset.toArray()).to.deep.equal([ 4, -3, 50 ]);
        expect(inCameraSpace(camera, controller.pivot).distanceTo(pivotInCamera)).to.be.closeTo(0, 1e-6);

        // the scene follows the pointer: 30 pixels right, 20 pixels up at the pivot's depth
        const worldPerPixel = (projection === EProjection.Orthographic
          ? 50 : 50 * 2 * Math.tan(camera.fov * threeMath.DEG2RAD * 0.5)) / 100;
        const shift = inCameraSpace(camera, pivot).sub(pivotInCamera);
        expect(shift.x).to.be.closeTo(30 * worldPerPixel, 1e-6);
        expect(shift.y).to.be.closeTo(20 * worldPerPixel, 1e-6);
        expect(shift.z).to.be.closeTo(0, 1e-6);
      });
    });

    describe("limits", function(){
      function limitedController(orbit: number[])
      {
        const created = createController(orbit, [ 0, 0, 50 ]);
        created.controller.setViewportSize(100, 100);
        created.controller.minOffset.set(-1, -2, 0.1);
        created.controller.maxOffset.set(1, 3, 1000);
        return created;
      }

      function pan(controller: CameraController, dX: number, dY: number)
      {
        controller["pan"](dX, dY);
      }

      it("match the legacy offset limits on a level camera, whatever the heading", function(){
        [ 0, 30, -135 ].forEach(heading => {
          const orbit = [ 0, heading, 0 ];
          const { camera, controller } = limitedController(orbit);

          pan(controller, 1000, -1000);
          update(controller);
          expectMatrixClose(camera.matrix, legacyMatrix(orbit, [ -1, -2, 50 ]));

          pan(controller, -2000, 2000);
          update(controller);
          expectMatrixClose(camera.matrix, legacyMatrix(orbit, [ 1, 3, 50 ]));
        });
      });

      it("keep the pivot in a vertical cylinder, whatever the view", function(){
        let seed = 1;
        const random = () => (seed = seed * 16807 % 2147483647) / 2147483647;

        const { controller } = limitedController([ 0, 0, 0 ]);
        for (let i = 0; i < 1000; i++) {
          controller.orbit.set(random() * 180 - 90, random() * 720 - 360, random() * 60 - 30);
          pan(controller, random() * 400 - 200, random() * 400 - 200);
          const { x, y, z } = controller.pivot;
          expect(Math.hypot(x, z)).to.be.at.most(1 + 1e-9);
          expect(y).to.be.within(-2 - 1e-9, 3 + 1e-9);
        }
      });

      it("can't be escaped by turning between pans", function(){
        // turning to face the pivot puts it on the view axis, out of reach of limits along the camera's axes
        const { controller } = limitedController([ 0, 0, 0 ]);
        for (let i = 0; i < 20; i++) {
          pan(controller, -1000, 0);
          const { x, z } = controller.pivot;
          controller.orbit.y = Math.atan2(-x, -z) * threeMath.RAD2DEG;
        }
        expect(Math.hypot(controller.pivot.x, controller.pivot.z)).to.be.closeTo(1, 1e-9);
      });

      it("hold the camera still when pushed against", function(){
        const { camera, controller } = limitedController([ -20, 30, 10 ]);
        pan(controller, 1000, -1000);
        update(controller);
        const matrix = camera.matrix.clone();

        for (let i = 0; i < 10; i++) {
          pan(controller, 50, -50);
          update(controller);
          expectMatrixClose(camera.matrix, matrix);
        }
      });

      it("never move a pivot that an explicit move left outside", function(){
        const { camera, controller } = limitedController([ -20, 30, 10 ]);
        controller.setPivot(new Vector3(5, 10, -4));
        const pivot = controller.pivot.toArray();

        // orbit and dolly
        controller["dolly"](1.2);
        controller["rotate"](15, 25, 0);
        expect(controller.pivot.toArray()).to.deep.equal(pivot);

        // idle frames
        update(controller);
        const matrix = camera.matrix.clone();
        for (let i = 0; i < 10; i++) {
          controller.updateCamera();
          expectMatrixClose(camera.matrix, matrix);
        }
        expect(controller.pivot.toArray()).to.deep.equal(pivot);
      });

      it("don't pull back a pivot that an explicit move left outside", function(){
        const { camera, controller } = limitedController([ 0, 0, 0 ]);
        controller.zoomExtents(new Box3(new Vector3(4, 9, -1), new Vector3(6, 11, 1)));
        expect(controller.pivot.toArray()).to.deep.equal([ 5, 10, 0 ]);

        // moving further outside, right and up, is blocked
        pan(controller, -4, 4);
        expect(controller.pivot.x).to.be.closeTo(5, 1e-9);
        expect(controller.pivot.y).to.be.closeTo(10, 1e-9);
        expect(controller.pivot.z).to.be.closeTo(0, 1e-9);

        // moving back inside is free
        const worldPerPixel = controller.offset.z * 2 * Math.tan(camera.fov * threeMath.DEG2RAD * 0.5) / 100;
        pan(controller, 4, -4);
        expect(controller.pivot.x).to.be.closeTo(5 - 4 * worldPerPixel, 1e-9);
        expect(controller.pivot.y).to.be.closeTo(10 - 4 * worldPerPixel, 1e-9);
      });
    });
  });

  describe("Fly and Walk modes", function(){
    function flyController(mode: EControllerMode, projection = EProjection.Perspective)
    {
      const created = createController([ -20, 30, 10 ], [ 4, -3, 50 ], [ 10, 5, -7 ], projection);
      created.controller.controllerMode = mode;
      created.controller.boundsRadius = 25;
      created.controller.setViewportSize(100, 100);
      return created;
    }

    it("puts the pivot on the camera", function(){
      const { camera, controller } = flyController(EControllerMode.Fly);
      const before = cameraPosition(camera);
      controller["rotate"](0, 0, 0);
      expect(controller.offset.toArray()).to.deep.equal([ 0, 0, 0 ]);
      expect(controller.pivot.distanceTo(before)).to.be.closeTo(0, 1e-6);
    });

    it("Fly moves along the camera's axes", function(){
      const { camera, controller } = flyController(EControllerMode.Fly);
      const expected = new Vector3(-0.2, 0.3, 2).applyMatrix4(camera.matrixWorld);
      // dX, dY in pixels: 20 * (boundsRadius / 25) / viewportHeight world units per pixel
      controller["pan"](1, 1.5);
      controller["dolly"](2);
      update(controller);
      expect(cameraPosition(camera).distanceTo(expected)).to.be.closeTo(0, 1e-6);
    });

    it("Walk doesn't move vertically on screen", function(){
      const { camera, controller } = flyController(EControllerMode.Walk);
      const before = cameraPosition(camera);
      controller["pan"](0, 10);
      update(controller);
      expect(cameraPosition(camera).distanceTo(before)).to.be.closeTo(0, 1e-6);
    });

    it("keeps the orthographic size", function(){
      const { camera, controller } = flyController(EControllerMode.Fly, EProjection.Orthographic);
      controller["dolly"](1);
      update(controller);
      expect(camera.size).to.equal(50);
    });


    [ EControllerMode.Fly, EControllerMode.Walk ].forEach(mode => {
      [ 0, 30 ].forEach(roll => {
        it(`${EControllerMode[mode]} rotation keeps the camera in place with a pivot (roll = ${roll})`, function(){
          const { camera, controller } = createController([ -20, 30, roll ], [ 4, -3, 50 ], [ 10, 5, -7 ]);
          controller.controllerMode = mode;
          controller.boundsRadius = 10;
          const before = cameraPosition(camera);

          controller["rotate"](15, 25, 0);
          update(controller);

          expect(cameraPosition(camera).distanceTo(before)).to.be.closeTo(0, 1e-6);
        });
      });
    });
  });
});
