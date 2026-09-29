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


describe("CameraController inertia and smoothing", function(){
  /** Controller driven by a fake clock */
  function createTimed()
  {
    const created = createController([ 0, 0, 0 ], [ 0, 0, 50 ]);
    const clock = { time: 0 };
    created.controller["getTime"] = () => clock.time;
    created.controller.setViewportSize(1000, 1000);
    created.controller.updateCamera(null, false); // initialize the clock
    return { ...created, clock };
  }

  function pointer(type: string, movementX = 0, movementY = 0)
  {
    return {
      type, movementX, movementY, isPrimary: true, source: "mouse", pointerCount: 1,
      activePositions: [], originalEvent: { button: 0 }, ctrlKey: false, shiftKey: false, altKey: false, metaKey: false,
    } as any;
  }

  /** Runs frames at the given rate until the camera stops (or maxTime), returns the time taken */
  function settle(controller: CameraController, clock: { time: number }, fps: number, maxTime = 5)
  {
    const start = clock.time;
    while (clock.time - start < maxTime * 1000) {
      clock.time += 1000 / fps;
      if (!controller.updateCamera(null, false)) {
        break;
      }
    }
    return (clock.time - start) / 1000;
  }

  /** Drags horizontally at the given speed (px/s) for the given duration, at the given frame rate */
  function drag(controller: CameraController, clock: { time: number }, fps: number, speed: number, duration: number, release = true)
  {
    controller.onPointer(pointer("pointer-down"));
    const frames = Math.round(duration * fps);
    for (let i = 0; i < frames; i++) {
      clock.time += 1000 / fps;
      controller.onPointer(pointer("pointer-move", speed / fps, 0));
      controller.updateCamera(null, false);
    }
    if (release) {
      controller.onPointer(pointer("pointer-up"));
    }
  }

  it("glides after release, the same distance at any frame rate", function(){
    const headings = [ 30, 60, 144 ].map(fps => {
      const { controller, clock } = createTimed();
      drag(controller, clock, fps, 600, 0.5);
      const released = controller.orbit.y;
      settle(controller, clock, fps);
      return { released, final: controller.orbit.y };
    });

    headings.forEach(({ released, final }) => {
      // glide = velocity * inertia = 600 px/s * 0.15 s = 90 px = 90 * 220 / 1000 degrees
      expect(Math.abs(final - released)).to.be.closeTo(90 * 0.22, 1);
    });
    expect(headings[0].final).to.be.closeTo(headings[2].final, 0.5);
  });

  it("doesn't glide when the pointer stopped before release", function(){
    const { controller, clock } = createTimed();
    drag(controller, clock, 60, 600, 0.5, false);
    // hold still for 200ms
    for (let i = 0; i < 12; i++) {
      clock.time += 1000 / 60;
      controller.updateCamera(null, false);
    }
    const heading = controller.orbit.y;
    controller.onPointer(pointer("pointer-up"));
    settle(controller, clock, 60);
    expect(controller.orbit.y).to.be.closeTo(heading, 0.1);
  });

  it("stops gliding when grabbed", function(){
    const { controller, clock } = createTimed();
    drag(controller, clock, 60, 600, 0.5);
    clock.time += 1000 / 60;
    controller.updateCamera(null, false);
    controller.onPointer(pointer("pointer-down"));
    const heading = controller.orbit.y;
    settle(controller, clock, 60, 1);
    expect(controller.orbit.y).to.equal(heading);
  });

  it("has no inertia when disabled", function(){
    const { controller, clock } = createTimed();
    controller.inertia = 0;
    drag(controller, clock, 60, 600, 0.5);
    const heading = controller.orbit.y;
    clock.time += 1000 / 60;
    controller.updateCamera(null, false);
    expect(controller.orbit.y).to.equal(heading);
    expect(settle(controller, clock, 60)).to.be.below(0.05);
  });

  it("smooths wheel zoom, with the same result as instant zoom", function(){
    const { controller, clock } = createTimed();
    controller.onTrigger({ type: "wheel", wheel: 1 } as any);
    controller.onTrigger({ type: "wheel", wheel: 1 } as any);
    clock.time += 1000 / 60;
    controller.updateCamera(null, false);
    // first frame only applies part of the zoom
    expect(controller.offset.z).to.be.above(50).and.below(50 * 1.07 * 1.07);
    settle(controller, clock, 60);
    expect(controller.offset.z).to.be.closeTo(50 * 1.07 * 1.07, 1e-6);

    // zooming back returns to the same distance
    controller.onTrigger({ type: "wheel", wheel: -1 } as any);
    controller.onTrigger({ type: "wheel", wheel: -1 } as any);
    settle(controller, clock, 60);
    expect(controller.offset.z).to.be.closeTo(50, 1e-6);
  });

  it("smooths arrow keys, moving the same total distance", function(){
    const { controller, clock } = createTimed();
    controller.onKeypress({ key: "ArrowRight", shiftKey: false, ctrlKey: false } as any);
    clock.time += 1000 / 60;
    controller.updateCamera(null, false);
    // one key press rotates by 20px
    const total = 20 * 0.22;
    expect(controller.orbit.y).to.be.below(0).and.above(-total);
    settle(controller, clock, 60);
    expect(controller.orbit.y).to.be.closeTo(-total, 1e-6);
  });

  it("stop() cancels ongoing motion", function(){
    const { controller, clock } = createTimed();
    drag(controller, clock, 60, 600, 0.5);
    controller.onTrigger({ type: "wheel", wheel: 1 } as any);
    const { y } = controller.orbit, { z } = controller.offset;
    controller.stop();
    settle(controller, clock, 60);
    expect(controller.orbit.y).to.equal(y);
    expect(controller.offset.z).to.equal(z);
  });
});
