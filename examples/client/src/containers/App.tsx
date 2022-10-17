import { useEffect, useRef } from "react";
import styled from "styled-components";
import * as VOXELIZE from "@voxelize/client";
import {
  EffectComposer,
  EffectPass,
  HueSaturationEffect,
  // PixelationEffect,
  RenderPass,
  SMAAEffect,
} from "postprocessing";
import * as THREE from "three";

import { setupWorld } from "src/core/world";
import { ColorText, Peers } from "@voxelize/client";
import { sRGBEncoding } from "three";

const GameWrapper = styled.div`
  background: black;
  position: absolute;
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
  overflow: hidden;
`;

const GameCanvas = styled.canvas`
  position: absolute;
  width: 100%;
  height: 100%;
`;

const Crosshair = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 6px;
  border: 2px solid #eeeeee55;
  z-index: 100000;

  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 4px;
    height: 4px;
    background: #eeeeee55;
  }
`;

let BACKEND_SERVER_INSTANCE = new URL(window.location.href);

if (BACKEND_SERVER_INSTANCE.origin.includes("localhost")) {
  BACKEND_SERVER_INSTANCE.port = "4000";
}

const BACKEND_SERVER = BACKEND_SERVER_INSTANCE.toString();

const App = () => {
  const domRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<VOXELIZE.World | null>(null);

  useEffect(() => {
    if (!domRef.current || !canvasRef.current) return;
    if (worldRef.current) return;

    const clock = new THREE.Clock();
    const world = new VOXELIZE.World({
      textureDimension: 32,
    });
    const chat = new VOXELIZE.Chat();
    const inputs = new VOXELIZE.Inputs<"menu" | "in-game" | "chat">();

    const character = new VOXELIZE.Character({});
    character.position.set(0, 10, -5);

    inputs.setNamespace("menu");

    const sky = new VOXELIZE.Sky(2000);
    sky.paint("top", VOXELIZE.drawSun);
    world.add(sky);

    const clouds = new VOXELIZE.Clouds({
      uFogColor: sky.uMiddleColor,
    });
    world.add(clouds);

    world.uniforms.fogColor.value.copy(sky.uMiddleColor.value);

    const camera = new THREE.PerspectiveCamera(
      90,
      domRef.current.offsetWidth / domRef.current.offsetHeight,
      0.1,
      5000
    );

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });
    renderer.setSize(
      renderer.domElement.offsetWidth,
      renderer.domElement.offsetHeight
    );
    renderer.setPixelRatio(window.devicePixelRatio || 1);

    renderer.outputEncoding = sRGBEncoding;

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(world, camera));

    const overlayEffect = new VOXELIZE.BlockOverlayEffect(world, camera);
    overlayEffect.addOverlay("water", new THREE.Color("#5F9DF7"), 0.05);

    composer.addPass(
      new EffectPass(
        camera,
        new SMAAEffect({}),
        overlayEffect
        // new PixelationEffect(6)
      )
    );

    domRef.current.appendChild(renderer.domElement);

    const controls = new VOXELIZE.RigidControls(
      camera,
      renderer.domElement,
      world,
      {
        lookInGhostMode: true,
        initialPosition: [0, 12, 0],
        bodyHeight: character.totalHeight,
        eyeHeight: character.eyeHeight / character.totalHeight,
      }
    );

    controls.attachCharacter(character);
    controls.connect(inputs, "in-game");

    renderer.setTransparentSort(VOXELIZE.TRANSPARENT_SORT(controls.object));

    const perspective = new VOXELIZE.Perspective(controls, world);
    perspective.connect(inputs, "in-game");

    const network = new VOXELIZE.Network();

    setupWorld(world);

    window.addEventListener("resize", () => {
      const width = domRef.current?.offsetWidth as number;
      const height = domRef.current?.offsetHeight as number;

      renderer.setSize(width, height);

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    });

    controls.on("lock", () => {
      inputs.setNamespace("in-game");
    });

    controls.on("unlock", () => {
      inputs.setNamespace("menu");
    });

    const debug = new VOXELIZE.Debug(document.body, {
      stats: false,
      tweakpane: false,
      showVoxelize: false,
    });

    inputs.bind(
      "t",
      () => {
        controls.unlock(() => {
          inputs.setNamespace("chat");
        });
      },
      "in-game"
    );

    inputs.bind(
      "Escape",
      () => {
        controls.lock();
      },
      "chat",
      {
        // Need this so that ESC doesn't unlock the pointerlock.
        occasion: "keyup",
      }
    );

    let hand = "Stone";
    let radius = 1;
    let circular = true;

    const bulkDestroy = () => {
      if (!controls.lookBlock) return;

      const [vx, vy, vz] = controls.lookBlock;

      const updates: VOXELIZE.BlockUpdate[] = [];

      for (let x = -radius; x <= radius; x++) {
        for (let y = -radius; y <= radius; y++) {
          for (let z = -radius; z <= radius; z++) {
            if (circular && x ** 2 + y ** 2 + z ** 2 > radius ** 2 - 1)
              continue;

            updates.push({
              vx: vx + x,
              vy: vy + y,
              vz: vz + z,
              type: 0,
            });
          }
        }
      }

      if (updates.length) controls.world.updateVoxels(updates);
    };

    const bulkPlace = () => {
      if (!controls.targetBlock) return;

      const {
        voxel: [vx, vy, vz],
        rotation,
      } = controls.targetBlock;

      const updates: VOXELIZE.BlockUpdate[] = [];
      const block = controls.world.getBlockByName(hand);

      for (let x = -radius; x <= radius; x++) {
        for (let y = -radius; y <= radius; y++) {
          for (let z = -radius; z <= radius; z++) {
            if (circular && x ** 2 + y ** 2 + z ** 2 > radius ** 2 - 1)
              continue;

            updates.push({
              vx: vx + x,
              vy: vy + y,
              vz: vz + z,
              type: block.id,
              rotation,
            });
          }
        }
      }

      if (updates.length) controls.world.updateVoxels(updates);
    };

    inputs.click(
      "left",
      () => {
        bulkDestroy();
      },
      "in-game"
    );

    inputs.click(
      "middle",
      () => {
        if (!controls.lookBlock) return;
        const [vx, vy, vz] = controls.lookBlock;
        const block = controls.world.getBlockByVoxel(vx, vy, vz);
        hand = block.name;
      },
      "in-game"
    );

    inputs.click(
      "right",
      () => {
        bulkPlace();
      },
      "in-game"
    );

    inputs.scroll(
      () => (radius = Math.min(100, radius + 1)),
      () => (radius = Math.max(1, radius - 1)),
      "in-game"
    );

    inputs.bind(
      "b",
      () => {
        inputs.remap("t", "c", { occasion: "keyup" });
      },
      "in-game",
      { identifier: "BRUH" }
    );

    const peers = new Peers<VOXELIZE.Character>(controls.object);

    peers.createPeer = () => {
      const peer = new VOXELIZE.Character();
      shadows.add(peer);
      return peer;
    };

    peers.onPeerUpdate = (object, data) => {
      object.set(data.position, data.direction);
    };

    world.add(peers);

    ColorText.SPLITTER = "$";

    inputs.bind(
      "o",
      () => {
        console.log(controls.object.position);
      },
      "in-game"
    );

    inputs.bind(
      "g",
      () => {
        controls.toggleGhostMode();
      },
      "in-game"
    );

    inputs.bind(
      "enter",
      () => {
        controls.lock();
      },
      "chat"
    );

    inputs.bind(
      "l",
      () => {
        network.action({ action: "create_world", data: "new_world" });
      },
      "in-game"
    );

    const toggleFly = () => {
      if (!controls.ghostMode) {
        const isFlying = controls.body.gravityMultiplier === 0;

        if (!isFlying) {
          controls.body.applyImpulse([0, 8, 0]);
        }

        setTimeout(() => {
          controls.body.gravityMultiplier = isFlying ? 1 : 0;
        }, 100);
      }
    };

    inputs.bind("f", toggleFly, "in-game");

    inputs.bind("j", debug.toggle, "*");

    debug.registerDisplay("Position", controls, "voxel");

    debug.registerDisplay("Sunlight", () => {
      return world.getSunlightByVoxel(...controls.voxel);
    });

    ["Red", "Green", "Blue"].forEach((color) => {
      debug.registerDisplay(color + " Light", () => {
        return world.getTorchLightByVoxel(
          ...controls.voxel,
          color.toUpperCase() as any
        );
      });
    });

    const shadows = new VOXELIZE.Shadows(world);
    shadows.add(character);

    // Create a test for atlas
    // setTimeout(() => {
    //   const plane = new THREE.Mesh(
    //     new THREE.PlaneBufferGeometry(100, 100),
    //     world.atlas.material
    //   );
    //   world.add(plane);
    // }, 1000);

    network
      .register(chat)
      .register(world)
      .register(peers)
      .connect(BACKEND_SERVER, { secret: "test" })
      .then(() => {
        network
          .join("world1")
          .then(() => {
            const animate = () => {
              requestAnimationFrame(animate);

              const delta = clock.getDelta();

              peers.update();
              controls.update(delta);

              clouds.update(camera.position, delta);
              sky.position.copy(camera.position);
              world.update(controls.object.position, delta);

              network.flush();

              perspective.update();
              shadows.update();
              debug.update();

              composer.render();
            };

            animate();
          })
          .catch((error) => {
            console.error("Connection error: " + error);
          });
      });

    worldRef.current = world;
  }, [domRef, canvasRef, worldRef]);

  return (
    <GameWrapper ref={domRef}>
      <Crosshair />
      <GameCanvas ref={canvasRef} />
    </GameWrapper>
  );
};

export default App;
