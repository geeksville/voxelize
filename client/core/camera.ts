import { PerspectiveCamera, Vector3, MathUtils } from "three";

import { Client } from "..";

/**
 * Parameters to initialize the Voxelize camera.
 */
type CameraParams = {
  /**
   * Default camera field of view. Defaults to `90`.
   */
  fov: number;

  /**
   * Default nearest distance camera can render. Defaults to `0.1`.
   */
  near: number;

  /**
   * Default farthest distance camera can render. Defaults to `2000`.
   */
  far: number;

  /**
   * Lerp factor of camera FOV/zoom change. Defaults to `0.7`.
   */
  lerpFactor: number;

  /**
   * Minimum polar angle that camera can look down to. Defaults to `0`.
   */
  minPolarAngle: number;

  /**
   * Maximum polar angle that camera can look up to. Defaults to `Math.PI`
   */
  maxPolarAngle: number;
};

const defaultParams: CameraParams = {
  fov: 90,
  near: 0.1,
  far: 2000,
  lerpFactor: 0.7,
  minPolarAngle: 0,
  maxPolarAngle: Math.PI,
};

/**
 * The **built-in** Voxelize camera class using ThreeJS's `PerspectiveCamera`, adding custom functionalities such as FOV interpolating and camera zooming. 
 * The camera by default has a zoom of 1.0.
 *
 * ## Example
 * This is an example on binding the <kbd>v</kbd> key to zooming the camera by a factor of 2.
 * ```ts 
 * client.inputs.bind(
 *   "v",
 *   () => {
 *     client.camera.setZoom(2);
 *   },
 *   "in-game",
 *   {
 *     occasion: "keydown",
 *   }
 * );

 * client.inputs.bind(
 *   "v",
 *   () => {
 *     client.camera.setZoom(1);
 *   },
 *   "in-game",
 *   {
 *     occasion: "keyup",
 *   }
 * );
 * ```
 */
class Camera {
  /**
   * Reference linking back to the Voxelize client instance.
   */
  public client: Client;

  /**
   * Parameters to initialize the Voxelize camera.
   */
  public params: CameraParams;

  /**
   * The inner ThreeJS perspective camera instance.
   */
  public threeCamera: PerspectiveCamera;

  private newZoom: number;
  private newFOV: number;

  /**
   * Construct a new Voxelize camera instance, setting up ThreeJS camera.
   *
   * @hidden
   */
  constructor(client: Client, params: Partial<CameraParams> = {}) {
    this.client = client;

    const { fov, near, far } = (this.params = {
      ...defaultParams,
      ...params,
    });

    this.newFOV = fov;
    this.newZoom = 1;

    // three.js camera
    this.threeCamera = new PerspectiveCamera(
      fov,
      this.client.rendering.aspectRatio,
      near,
      far
    );

    // initialize camera position
    this.threeCamera.lookAt(new Vector3(0, 0, 0));

    // listen to resize, and adjust accordingly
    // ? should move to it's own logic for all event listeners?
    window.addEventListener("resize", () => {
      client.rendering.adjustRenderer();

      this.threeCamera.aspect = client.rendering.aspectRatio;
      this.threeCamera.updateProjectionMatrix();
    });
  }

  /**
   * Interpolate the camera's zoom. Default zoom is 1.0.
   *
   * @param zoom - The new zoom for the camera to lerp to.
   */
  setZoom = (zoom: number) => {
    this.newZoom = zoom;
  };

  /**
   * Interpolate the camera's FOV. Default FOV is 90.
   *
   * @param fov - The new field of view to lerp to.
   */
  setFOV = (fov: number) => {
    this.newFOV = fov;
  };

  /**
   * Updater of the camera.
   *
   * @hidden
   */
  update = () => {
    if (this.newFOV !== this.threeCamera.fov) {
      this.threeCamera.fov = MathUtils.lerp(
        this.threeCamera.fov,
        this.newFOV,
        this.params.lerpFactor
      );
      this.threeCamera.updateProjectionMatrix();
    }

    if (this.newZoom !== this.threeCamera.zoom) {
      this.threeCamera.zoom = MathUtils.lerp(
        this.threeCamera.zoom,
        this.newZoom,
        this.params.lerpFactor
      );
      this.threeCamera.updateProjectionMatrix();
    }

    this.threeCamera.updateMatrix();
    this.threeCamera.updateMatrixWorld();
  };
}

export type { CameraParams };

export { Camera };
