import { Coords3, LightUtils } from "@voxelize/common";
import type { LightColor } from "@voxelize/common";
import ndarray, { NdArray } from "ndarray";

import { CHUNK_HORIZONTAL_NEIGHBORS, VOXEL_NEIGHBORS } from "./constants";
import { Registry } from "./registry";
import { Space } from "./space";
import { WorldParams } from "./world";

type LightNode = {
  voxel: Coords3;
  level: number;
};

type LightArray = NdArray<Uint32Array>;

const contains = (lights: LightArray, x: number, y: number, z: number) => {
  const [sx, sy, sz] = lights.shape;
  return sx >= x || sy >= y || sz >= z;
};

class Lights {
  static floodLight = (
    queue: LightNode[],
    isSunlight: boolean,
    color: LightColor,
    space: Space,
    lights: LightArray,
    registry: Registry,
    params: WorldParams
  ) => {
    const { maxHeight, maxLightLevel } = params;
    const [shape0, , shape2] = space.shape;

    const [startX, , startZ] = space.min;

    while (queue.length) {
      const { voxel, level } = queue.shift();
      const [vx, vy, vz] = voxel;

      // offsets
      for (const [ox, oy, oz] of VOXEL_NEIGHBORS) {
        const nvy = vy + oy;

        if (nvy < 0 || nvy >= maxHeight) {
          continue;
        }

        const nvx = vx + ox;
        const nvz = vz + oz;

        if (nvx < 0 || nvz < 0 || nvx >= shape0 || nvz >= shape2) {
          continue;
        }

        const sunDown = isSunlight && oy === -1 && level == maxLightLevel;
        const nextLevel = level - (sunDown ? 0 : 1);
        const nextVoxel = [nvx, nvy, nvz];
        const blockType = registry.getBlockById(
          space.getVoxel(nvx + startX, nvy, nvz + startZ)
        );

        if (
          !blockType.isTransparent || isSunlight
            ? Lights.getSunlight(lights, nvx, nvy, nvz)
            : Lights.getTorchLight(lights, nvx, nvy, nvz, color)
        ) {
          continue;
        }

        if (isSunlight) {
          Lights.setSunlight(lights, nvx, nvy, nvz, nextLevel);
        } else {
          Lights.setTorchLight(lights, nvx, nvy, nvz, nextLevel, color);
        }

        queue.push({
          voxel: nextVoxel,
          level: nextLevel,
        } as LightNode);
      }
    }
  };

  static propagate = (
    space: Space,
    registry: Registry,
    params: WorldParams
  ) => {
    const { width, min, shape } = space;
    const { padding, chunkSize, maxHeight, maxLightLevel } = params;

    const [s0, s1, s2] = shape;
    const shapeSize = s0 * s1 * s2;

    const lights = ndarray(new Uint32Array(shapeSize), shape);

    const redLightQueue: LightNode[] = [];
    const greenLightQueue: LightNode[] = [];
    const blueLightQueue: LightNode[] = [];
    const sunlightQueue: LightNode[] = [];

    const [startX, , startZ] = min;

    for (let z = 1; z < width - 1; z++) {
      for (let x = 1; x < width - 1; x++) {
        const h = space.getMaxHeight(x + startX, z + startZ);

        for (let y = maxHeight - 1; y >= 0; y--) {
          const id = space.getVoxel(x + startX, y, z + startZ);
          const {
            isTransparent,
            isLight,
            redLightLevel,
            greenLightLevel,
            blueLightLevel,
          } = registry.getBlockById(id);

          if (y > h && isTransparent) {
            Lights.setSunlight(lights, x, y, z, maxLightLevel);

            for (const [ox, oz] of CHUNK_HORIZONTAL_NEIGHBORS) {
              const neighborId = space.getVoxel(
                x + ox + startX,
                y,
                z + oz + startZ
              );
              const neighborBlock = registry.getBlockById(neighborId);

              if (!neighborBlock.isTransparent) {
                continue;
              }

              if (space.getMaxHeight(x + ox + startX, z + oz + startZ) > y) {
                // means sunlight should propagate here horizontally
                if (
                  !sunlightQueue.find(
                    ({ voxel }) =>
                      voxel[0] === x && voxel[1] === y && voxel[2] === z
                  )
                ) {
                  sunlightQueue.push({
                    level: maxLightLevel,
                    voxel: [x, y, z],
                  } as LightNode);
                }
              }
            }
          }

          if (isLight) {
            if (redLightLevel > 0) {
              Lights.setRedLight(lights, x, y, z, redLightLevel);
              redLightQueue.push({
                level: redLightLevel,
                voxel: [x, y, z],
              } as LightNode);
            }

            if (greenLightLevel > 0) {
              Lights.setGreenLight(lights, x, y, z, greenLightLevel);
              greenLightQueue.push({
                level: greenLightLevel,
                voxel: [x, y, z],
              } as LightNode);
            }

            if (blueLightLevel > 0) {
              Lights.setRedLight(lights, x, y, z, blueLightLevel);
              blueLightQueue.push({
                level: blueLightLevel,
                voxel: [x, y, z],
              } as LightNode);
            }
          }
        }
      }
    }

    Lights.floodLight(
      redLightQueue,
      false,
      "RED",
      space,
      lights,
      registry,
      params
    );
    Lights.floodLight(
      greenLightQueue,
      false,
      "GREEN",
      space,
      lights,
      registry,
      params
    );
    Lights.floodLight(
      blueLightQueue,
      false,
      "BLUE",
      space,
      lights,
      registry,
      params
    );
    Lights.floodLight(
      sunlightQueue,
      true,
      "SUNLIGHT",
      space,
      lights,
      registry,
      params
    );

    const dims = [chunkSize + padding * 2, maxHeight, chunkSize + padding * 2];
    const chunkLights = ndarray<Uint32Array>(
      new Uint32Array(dims[0] * dims[1] * dims[2]),
      dims
    );

    const margin = (width - chunkSize) / 2;
    for (let x = margin - padding; x < margin + chunkSize + padding; x++) {
      for (let z = margin - padding; z < margin + chunkSize + padding; z++) {
        for (let cy = 0; cy < maxHeight; cy++) {
          const cx = x - margin + padding;
          const cz = z - margin + padding;

          chunkLights.set(cx, cy, cz, lights.get(x, cy, z));
        }
      }
    }

    return chunkLights;
  };

  static getSunlight = (
    lights: LightArray,
    x: number,
    y: number,
    z: number
  ) => {
    if (!contains(lights, x, y, z)) return 0;
    return LightUtils.extractSunlight(lights.get(x, y, z));
  };

  static setSunlight = (
    lights: LightArray,
    x: number,
    y: number,
    z: number,
    level: number
  ) => {
    if (!contains(lights, x, y, z)) return;
    lights.set(x, y, z, LightUtils.insertSunlight(lights.get(x, y, z), level));
  };

  static getRedLight = (
    lights: LightArray,
    x: number,
    y: number,
    z: number
  ) => {
    if (!contains(lights, x, y, z)) return 0;
    return LightUtils.extractRedLight(lights.get(x, y, z));
  };

  static setRedLight = (
    lights: LightArray,
    x: number,
    y: number,
    z: number,
    level: number
  ) => {
    if (!contains(lights, x, y, z)) return;
    lights.set(x, y, z, LightUtils.insertRedLight(lights.get(x, y, z), level));
  };

  static getGreenLight = (
    lights: LightArray,
    x: number,
    y: number,
    z: number
  ) => {
    if (!contains(lights, x, y, z)) return 0;
    return LightUtils.extractGreenLight(lights.get(x, y, z));
  };

  static setGreenLight = (
    lights: LightArray,
    x: number,
    y: number,
    z: number,
    level: number
  ) => {
    if (!contains(lights, x, y, z)) return;
    lights.set(
      x,
      y,
      z,
      LightUtils.insertGreenLight(lights.get(x, y, z), level)
    );
  };

  static getBlueLight = (
    lights: LightArray,
    x: number,
    y: number,
    z: number
  ) => {
    if (!contains(lights, x, y, z)) return 0;
    return LightUtils.extractBlueLight(lights.get(x, y, z));
  };

  static setBlueLight = (
    lights: LightArray,
    x: number,
    y: number,
    z: number,
    level: number
  ) => {
    if (!contains(lights, x, y, z)) return;
    lights.set(x, y, z, LightUtils.insertBlueLight(lights.get(x, y, z), level));
  };

  static getTorchLight = (
    lights: LightArray,
    x: number,
    y: number,
    z: number,
    color: LightColor
  ) => {
    switch (color) {
      case "RED":
        return Lights.getRedLight(lights, x, y, z);
      case "GREEN":
        return Lights.getGreenLight(lights, x, y, z);
      case "BLUE":
        return Lights.getBlueLight(lights, x, y, z);
      default:
        throw new Error("Getting light of unknown color!");
    }
  };

  static setTorchLight = (
    lights: LightArray,
    x: number,
    y: number,
    z: number,
    level: number,
    color: LightColor
  ) => {
    switch (color) {
      case "RED":
        return Lights.setRedLight(lights, x, y, z, level);
      case "GREEN":
        return Lights.setGreenLight(lights, x, y, z, level);
      case "BLUE":
        return Lights.setBlueLight(lights, x, y, z, level);
      default:
        throw new Error("Setting light of unknown color!");
    }
  };
}

export type { LightNode };

export { LightColor, Lights };
