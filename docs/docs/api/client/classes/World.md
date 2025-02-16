---
id: "World"
title: "Class: World"
sidebar_label: "World"
sidebar_position: 0
custom_edit_url: null
---

A Voxelize world handles the chunk loading and rendering, as well as any 3D objects.
**This class extends the [ThreeJS `Scene` class](https://threejs.org/docs/#api/en/scenes/Scene).**
This means that you can add any ThreeJS objects to the world, and they will be rendered. The world
also implements [NetIntercept](../interfaces/NetIntercept.md), which means it intercepts chunk-related packets from the server
and constructs chunk meshes from them. You can optionally disable this by setting `shouldGenerateChunkMeshes` to `false`
in the options.

There are a couple components that are by default created by the world that holds data:
- [registry](World.md#registry-120): A block registry that handles block textures and block instances.
- [chunks](World.md#chunks-120): A chunk manager that stores all the chunks in the world.
- [physics](World.md#physics-120): A physics engine that handles voxel AABB physics simulation of client-side physics.
- [loader](World.md#loader-120): An asset loader that handles loading textures and other assets.
- [sky](World.md#sky-120): A sky that can render the sky and the sun.
- [clouds](World.md#clouds-120): A clouds that renders the cubical clouds.

One thing to keep in mind that there are no specific setters like `setVoxelByVoxel` or `setVoxelRotationByVoxel`.
This is because, instead, you should use `updateVoxel` and `updateVoxels` to update voxels.

# Example
```ts
const world = new VOXELIZE.World();

// Update the voxel at `(0, 0, 0)` to a voxel type `12` in the world across the network.
world.updateVoxel(0, 0, 0, 12)

// Register the interceptor with the network.
network.register(world);

// Register an image to block sides.
world.applyBlockTexture("Test", VOXELIZE.ALL_FACES, "https://example.com/test.png");

// Update the world every frame.
world.update(controls.position);
```

![World](/img/docs/world.png)

## Hierarchy

- `Scene`

  ↳ **`World`**

## Implements

- [`NetIntercept`](../interfaces/NetIntercept.md)

## Methods

### addChunkInitListener

▸ **addChunkInitListener**(`coords`, `listener`): `void`

Add a listener to a chunk. This listener will be called when this chunk is loaded and ready to be rendered.
This is useful for, for example, teleporting the player to the top of the chunk when the player just joined.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `coords` | [`Coords2`](../modules.md#coords2-120) | The chunk coordinates to listen to. |
| `listener` | (`chunk`: `Chunk`) => `void` | The listener to add. |

#### Returns

`void`

___

### applyBlockFrames

▸ **applyBlockFrames**(`idOrName`, `faceNames`, `keyframes`, `fadeFrames?`): `Promise`<`void`\>

Apply a set of keyframes to a block. This will load the keyframes from the sources and start the animation
to play the keyframes on the block's texture atlas.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `idOrName` | `string` \| `number` | `undefined` | The ID or name of the block. |
| `faceNames` | `string` \| `string`[] | `undefined` | The face name or names to apply the texture to. |
| `keyframes` | [`number`, `string` \| `Color` \| `HTMLImageElement`][] | `undefined` | The keyframes to apply to the texture. |
| `fadeFrames` | `number` | `0` | The number of frames to fade between each keyframe. |

#### Returns

`Promise`<`void`\>

___

### applyBlockGif

▸ **applyBlockGif**(`idOrName`, `faceNames`, `source`, `interval?`): `Promise`<`void`\>

Apply a GIF animation to a block. This will load the GIF from the source and start the animation
using [applyBlockFrames](World.md#applyblockframes-120) internally.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `idOrName` | `string` | `undefined` | The ID or name of the block. |
| `faceNames` | `string` \| `string`[] | `undefined` | The face name or names to apply the texture to. |
| `source` | `string` | `undefined` | The source of the GIF. Note that this must be a GIF file ending with `.gif`. |
| `interval` | `number` | `66.666667` | The interval between each frame of the GIF in milliseconds. Defaults to `66.666667ms`. |

#### Returns

`Promise`<`void`\>

___

### applyBlockTexture

▸ **applyBlockTexture**(`idOrName`, `faceNames`, `source`): `Promise`<`void`\>

Apply a texture to a face or faces of a block. This will automatically load the image from the source
and draw it onto the block's texture atlas.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `idOrName` | `string` \| `number` | The ID or name of the block. |
| `faceNames` | `string` \| `string`[] | The face names to apply the texture to. |
| `source` | `string` \| `Color` \| `Texture` \| `HTMLImageElement` | The source of the texture. |

#### Returns

`Promise`<`void`\>

___

### applyBlockTextures

▸ **applyBlockTextures**(`data`): `Promise`<`void`[]\>

Apply multiple block textures at once. See [applyBlockTexture](World.md#applyblocktexture-120) for more information.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `data` | { `faceNames`: `string` \| `string`[] ; `idOrName`: `string` \| `number` ; `source`: `string` \| `Color`  }[] | The data to apply the block textures. |

#### Returns

`Promise`<`void`[]\>

A promise that resolves when all the textures are applied.

___

### customizeBlockDynamic

▸ **customizeBlockDynamic**(`idOrName`, `fn`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `idOrName` | `string` \| `number` |
| `fn` | (`pos`: [`Coords3`](../modules.md#coords3-120), `world`: [`World`](World.md)) => { `aabbs`: `AABB`[] ; `faces`: { `corners`: { `pos`: `number`[] ; `uv`: `number`[]  }[] ; `dir`: `number`[] ; `independent`: `boolean` ; `name`: `string` ; `range`: [`TextureRange`](../modules.md#texturerange-120)  }[] ; `isTransparent`: `boolean`[]  } |

#### Returns

`void`

___

### customizeMaterialShaders

▸ **customizeMaterialShaders**(`idOrName`, `faceName?`, `data?`): [`CustomChunkShaderMaterial`](../modules.md#customchunkshadermaterial-120)

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `idOrName` | `string` \| `number` | `undefined` |
| `faceName` | `string` | `null` |
| `data` | `Object` | `undefined` |
| `data.fragmentShader` | `string` | `undefined` |
| `data.uniforms?` | `Object` | `undefined` |
| `data.vertexShader` | `string` | `undefined` |

#### Returns

[`CustomChunkShaderMaterial`](../modules.md#customchunkshadermaterial-120)

___

### getBlockAt

▸ **getBlockAt**(`px`, `py`, `pz`): [`Block`](../modules.md#block-120)

Get the block type data by a 3D world position.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `px` | `number` | The x coordinate of the position. |
| `py` | `number` | The y coordinate of the position. |
| `pz` | `number` | The z coordinate of the position. |

#### Returns

[`Block`](../modules.md#block-120)

The block at the given position, or null if it does not exist.

___

### getBlockById

▸ **getBlockById**(`id`): [`Block`](../modules.md#block-120)

Get the block type data by a block id.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `id` | `number` | The block id. |

#### Returns

[`Block`](../modules.md#block-120)

The block data for the given id, or null if it does not exist.

___

### getBlockByName

▸ **getBlockByName**(`name`): [`Block`](../modules.md#block-120)

Get the block type data by a block name.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The block name. |

#### Returns

[`Block`](../modules.md#block-120)

The block data for the given name, or null if it does not exist.

___

### getBlockFaceMaterial

▸ **getBlockFaceMaterial**(`idOrName`, `faceName?`): [`CustomChunkShaderMaterial`](../modules.md#customchunkshadermaterial-120)

#### Parameters

| Name | Type |
| :------ | :------ |
| `idOrName` | `string` \| `number` |
| `faceName?` | `string` |

#### Returns

[`CustomChunkShaderMaterial`](../modules.md#customchunkshadermaterial-120)

___

### getBlockOf

▸ **getBlockOf**(`idOrName`): [`Block`](../modules.md#block-120)

#### Parameters

| Name | Type |
| :------ | :------ |
| `idOrName` | `string` \| `number` |

#### Returns

[`Block`](../modules.md#block-120)

___

### getChunkByCoords

▸ **getChunkByCoords**(`cx`, `cz`): `Chunk`

Get a chunk by its 2D coordinates.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `cx` | `number` | The x coordinate of the chunk. |
| `cz` | `number` | The z coordinate of the chunk. |

#### Returns

`Chunk`

The chunk at the given coordinates, or undefined if it does not exist.

___

### getChunkByName

▸ **getChunkByName**(`name`): `Chunk`

Get a chunk by its name.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The name of the chunk to get. |

#### Returns

`Chunk`

The chunk with the given name, or undefined if it does not exist.

___

### getChunkByPosition

▸ **getChunkByPosition**(`px`, `py`, `pz`): `Chunk`

Get a chunk that contains a given position.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `px` | `number` | The x coordinate of the position. |
| `py` | `number` | The y coordinate of the position. |
| `pz` | `number` | The z coordinate of the position. |

#### Returns

`Chunk`

The chunk that contains the position at the given position, or undefined if it does not exist.

___

### getChunkStatus

▸ **getChunkStatus**(`cx`, `cz`): ``"to request"`` \| ``"requested"`` \| ``"processing"`` \| ``"loaded"``

Get the status of a chunk.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `cx` | `number` | The x 2D coordinate of the chunk. |
| `cz` | `number` | The z 2D coordinate of the chunk. |

#### Returns

``"to request"`` \| ``"requested"`` \| ``"processing"`` \| ``"loaded"``

The status of the chunk.

___

### getLightColorAt

▸ **getLightColorAt**(`vx`, `vy`, `vz`): `Color`

Get a color instance that represents what an object would be like
if it were rendered at the given 3D voxel coordinate. This is useful
to dynamically shade objects based on their position in the world. Also
used in [LightShined](LightShined.md).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vx` | `number` | The voxel's X position. |
| `vy` | `number` | The voxel's Y position. |
| `vz` | `number` | The voxel's Z position. |

#### Returns

`Color`

The voxel's light color at the given coordinate.

___

### getMaxHeightAt

▸ **getMaxHeightAt**(`px`, `pz`): `number`

Get the highest block at a x/z position. Highest block means the first block counting downwards that
isn't empty (`isEmpty`).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `px` | `number` | The x coordinate of the position. |
| `pz` | `number` | The z coordinate of the position. |

#### Returns

`number`

The highest block at the given position, or 0 if it does not exist.

___

### getPreviousValueAt

▸ **getPreviousValueAt**(`px`, `py`, `pz`, `count?`): `number`

Get the previous value of a voxel by a 3D world position.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `px` | `number` | `undefined` | The x coordinate of the position. |
| `py` | `number` | `undefined` | The y coordinate of the position. |
| `pz` | `number` | `undefined` | The z coordinate of the position. |
| `count` | `number` | `1` | By how much to look back in the history. Defaults to `1`. |

#### Returns

`number`

___

### getSunlightAt

▸ **getSunlightAt**(`px`, `py`, `pz`): `number`

Get a voxel sunlight by a 3D world position.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `px` | `number` | The x coordinate of the position. |
| `py` | `number` | The y coordinate of the position. |
| `pz` | `number` | The z coordinate of the position. |

#### Returns

`number`

The voxel sunlight at the given position, or 0 if it does not exist.

___

### getTorchLightAt

▸ **getTorchLightAt**(`px`, `py`, `pz`, `color`): `number`

Get a voxel torch light by a 3D world position.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `px` | `number` | The x coordinate of the position. |
| `py` | `number` | The y coordinate of the position. |
| `pz` | `number` | The z coordinate of the position. |
| `color` | [`LightColor`](../modules.md#lightcolor-120) | The color of the torch light. |

#### Returns

`number`

The voxel torchlight at the given position, or 0 if it does not exist.

___

### getVoxelAt

▸ **getVoxelAt**(`px`, `py`, `pz`): `number`

Get a voxel by a 3D world position.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `px` | `number` | The x coordinate of the position. |
| `py` | `number` | The y coordinate of the position. |
| `pz` | `number` | The z coordinate of the position. |

#### Returns

`number`

The voxel at the given position, or 0 if it does not exist.

___

### getVoxelRotationAt

▸ **getVoxelRotationAt**(`px`, `py`, `pz`): [`BlockRotation`](BlockRotation.md)

Get a voxel rotation by a 3D world position.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `px` | `number` | The x coordinate of the position. |
| `py` | `number` | The y coordinate of the position. |
| `pz` | `number` | The z coordinate of the position. |

#### Returns

[`BlockRotation`](BlockRotation.md)

The voxel rotation at the given position, or the default rotation if it does not exist.

___

### getVoxelStageAt

▸ **getVoxelStageAt**(`px`, `py`, `pz`): `number`

Get a voxel stage by a 3D world position.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `px` | `number` | The x coordinate of the position. |
| `py` | `number` | The y coordinate of the position. |
| `pz` | `number` | The z coordinate of the position. |

#### Returns

`number`

The voxel stage at the given position, or 0 if it does not exist.

___

### initialize

▸ **initialize**(): `Promise`<`void`\>

Initialize the world with the data received from the server. This includes populating
the registry, setting the options, and creating the texture atlas.

#### Returns

`Promise`<`void`\>

___

### isChunkInView

▸ **isChunkInView**(`center`, `target`, `direction`, `threshold`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `center` | [`Coords2`](../modules.md#coords2-120) |
| `target` | [`Coords2`](../modules.md#coords2-120) |
| `direction` | `Vector3` |
| `threshold` | `number` |

#### Returns

`boolean`

___

### isWithinWorld

▸ **isWithinWorld**(`cx`, `cz`): `boolean`

Whether or not if this chunk coordinate is within (inclusive) the world's bounds. That is, if this chunk coordinate
is within [WorldServerOptions.minChunk](../modules.md#worldserveroptions-120) and [WorldServerOptions.maxChunk](../modules.md#worldserveroptions-120).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `cx` | `number` | The chunk's X position. |
| `cz` | `number` | The chunk's Z position. |

#### Returns

`boolean`

Whether or not this chunk is within the bounds of the world.

___

### makeBlockMesh

▸ **makeBlockMesh**(`idOrName`, `options?`): `Group`

Get a mesh of the model of the given block.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `idOrName` | `string` \| `number` | - |
| `options` | `Partial`<{ `crumbs`: `boolean` ; `material`: ``"basic"`` \| ``"standard"`` ; `separateFaces`: `boolean`  }\> | The options of creating this block mesh. |

#### Returns

`Group`

A 3D mesh (group) of the block model.

___

### raycastVoxels

▸ **raycastVoxels**(`origin`, `direction`, `maxDistance`, `options?`): `Object`

Raycast through the world of voxels and return the details of the first block intersection.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `origin` | [`Coords3`](../modules.md#coords3-120) | The origin of the ray. |
| `direction` | [`Coords3`](../modules.md#coords3-120) | The direction of the ray. |
| `maxDistance` | `number` | The maximum distance of the ray. |
| `options` | `Object` | The options for the ray. |
| `options.ignoreFluids?` | `boolean` | Whether or not to ignore fluids. Defaults to `true`. |
| `options.ignoreList?` | `number`[] | A list of blocks to ignore. Defaults to `[]`. |
| `options.ignorePassables?` | `boolean` | Whether or not to ignore passable blocks. Defaults to `false`. |
| `options.ignoreSeeThrough?` | `boolean` | Whether or not to ignore see through blocks. Defaults to `false`. |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `normal` | `number`[] |
| `point` | `number`[] |
| `voxel` | `number`[] |

___

### setResolutionOf

▸ **setResolutionOf**(`idOrName`, `faceNames`, `resolution`): `void`

Apply a resolution to a block. This will set the resolution of the block's texture atlas.
Keep in mind that this face or faces must be independent.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `idOrName` | `string` \| `number` | The ID or name of the block. |
| `faceNames` | `string` \| `string`[] | The face name or names to apply the resolution to. |
| `resolution` | `number` | The resolution to apply to the block, in pixels. |

#### Returns

`void`

___

### update

▸ **update**(`position?`, `direction?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `position` | `Vector3` |
| `direction` | `Vector3` |

#### Returns

`void`

___

### updateSkyAndClouds

▸ **updateSkyAndClouds**(`position`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `position` | `Vector3` |

#### Returns

`void`

___

### updateVoxel

▸ **updateVoxel**(`vx`, `vy`, `vz`, `type`, `rotation?`, `yRotation?`): `void`

This sends a block update to the server and updates across the network. Block updates are queued to
[World.chunks.toUpdate](World.md#chunks-120) and scaffolded to the server [WorldClientOptions.maxUpdatesPerUpdate](../modules.md#worldclientoptions-120) times
per tick. Keep in mind that for rotation and y-rotation, the value should be one of the following:
- Rotation: [PX_ROTATION](../modules.md#px_rotation-120) | [NX_ROTATION](../modules.md#nx_rotation-120) | [PY_ROTATION](../modules.md#py_rotation-120) | [NY_ROTATION](../modules.md#ny_rotation-120) | [PZ_ROTATION](../modules.md#pz_rotation-120) | [NZ_ROTATION](../modules.md#nz_rotation-120)
- Y-rotation: 0 to [Y_ROT_SEGMENTS](../modules.md#y_rot_segments-120) - 1.

This ignores blocks that are not defined, and also ignores rotations for blocks that are not [Block.rotatable](../modules.md#block-120) (Same for if
block is not [Block.yRotatable](../modules.md#block-120)).

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `vx` | `number` | `undefined` | The voxel's X position. |
| `vy` | `number` | `undefined` | The voxel's Y position. |
| `vz` | `number` | `undefined` | The voxel's Z position. |
| `type` | `number` | `undefined` | The type of the voxel. |
| `rotation` | `number` | `PY_ROTATION` | The major axis rotation of the voxel. |
| `yRotation` | `number` | `0` | The Y rotation on the major axis. Applies to blocks with major axis of PY or NY. |

#### Returns

`void`

___

### updateVoxels

▸ **updateVoxels**(`updates`): `void`

This sends a list of block updates to the server and updates across the network. Block updates are queued to
[World.chunks.toUpdate](World.md#chunks-120) and scaffolded to the server [WorldClientOptions.maxUpdatesPerUpdate](../modules.md#worldclientoptions-120) times
per tick. Keep in mind that for rotation and y-rotation, the value should be one of the following:

- Rotation: [PX_ROTATION](../modules.md#px_rotation-120) | [NX_ROTATION](../modules.md#nx_rotation-120) | [PY_ROTATION](../modules.md#py_rotation-120) | [NY_ROTATION](../modules.md#ny_rotation-120) | [PZ_ROTATION](../modules.md#pz_rotation-120) | [NZ_ROTATION](../modules.md#nz_rotation-120)
- Y-rotation: 0 to [Y_ROT_SEGMENTS](../modules.md#y_rot_segments-120) - 1.

This ignores blocks that are not defined, and also ignores rotations for blocks that are not [Block.rotatable](../modules.md#block-120) (Same for if
block is not [Block.yRotatable](../modules.md#block-120)).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `updates` | [`BlockUpdate`](../modules.md#blockupdate-120)[] | A list of updates to send to the server. |

#### Returns

`void`

## Properties

### chunks

• **chunks**: `Chunks`

The manager that holds all chunk-related data, such as chunk meshes and voxel data.

___

### clouds

• **clouds**: [`Clouds`](Clouds.md)

The clouds that renders the cubical clouds.

___

### isInitialized

• **isInitialized**: `boolean` = `false`

Whether or not this world is connected to the server and initialized with data from the server.

___

### loader

• **loader**: [`Loader`](Loader.md)

An asset loader to load in things like textures, images, GIFs and audio buffers.

___

### options

• **options**: [`WorldOptions`](../modules.md#worldoptions-120)

The options to create the world.

___

### physics

• **physics**: `Engine`

The voxel physics engine using `@voxelize/physics-engine`.

___

### registry

• **registry**: [`Registry`](Registry.md)

The block registry that holds all block data, such as texture and block properties.

___

### sky

• **sky**: [`Sky`](Sky.md)

The sky that renders the sky and the sun.

## Constructors

### constructor

• **new World**(`options?`)

Create a new Voxelize world.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | `Partial`<[`WorldOptions`](../modules.md#worldoptions-120)\> | The options to create the world. |

#### Overrides

Scene.constructor

## Accessors

### deleteRadius

• `get` **deleteRadius**(): `number`

#### Returns

`number`

___

### renderRadius

• `get` **renderRadius**(): `number`

#### Returns

`number`

• `set` **renderRadius**(`radius`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `radius` | `number` |

#### Returns

`void`

___

### time

• `get` **time**(): `number`

#### Returns

`number`

• `set` **time**(`time`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `time` | `number` |

#### Returns

`void`
