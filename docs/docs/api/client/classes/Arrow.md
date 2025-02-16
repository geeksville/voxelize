---
id: "Arrow"
title: "Class: Arrow"
sidebar_label: "Arrow"
sidebar_position: 0
custom_edit_url: null
---

A helper for visualizing a direction. This is useful for debugging.

This arrow is essentially a Voxelize version of the [`ArrowHelper`](https://threejs.org/docs/#api/en/helpers/ArrowHelper) from Three.js.

# Example
```ts
const arrow = new VOXELIZE.Arrow();

arrow.position.set(10, 0, 10);
arrow.setDirection(new THREE.Vector3(1, 0, 0));

world.add(arrow);
```

![Arrow](/img/docs/arrow.png)

## Hierarchy

- `ArrowHelper`

  ↳ **`Arrow`**

## Constructors

### constructor

• **new Arrow**(`options?`)

Create a new arrow.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | `Partial`<[`ArrowOptions`](../modules.md#arrowoptions-120)\> | Parameters to create the arrow. |

#### Overrides

ArrowHelper.constructor

## Properties

### options

• **options**: [`ArrowOptions`](../modules.md#arrowoptions-120)

Parameters used to create the arrow.
