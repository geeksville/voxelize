import { MessageProtocol, PeerProtocol } from "@voxelize/transport/src/types";
import { Group, Object3D, Quaternion, Vector3 } from "three";

import { Character } from "../libs";

import { NetIntercept } from "./network";

const emptyQ = new Quaternion();
const emptyP = new Vector3();

/**
 * Parameters to customize the peers manager.
 */
export type PeersOptions = {
  /**
   * Whether or not should the client themselves be counted as "updated". In other words,
   * whether or not should the update function be called on the client's own data. Defaults
   * to `false`.
   */
  countSelf: boolean;

  /**
   * Whether or not should the peers manager automatically call `update` on any children
   * mesh. Defaults to `true`.
   */
  updateChildren: boolean;
};

const defaultOptions: PeersOptions = {
  countSelf: false,
  updateChildren: true,
};

/**
 * A class that allows you to add multiplayer functionality to your Voxelize game. This implements
 * a {@link NetIntercept} that intercepts all peer-related messages and allows you to customize
 * the behavior of multiplayer functionality. This class also extends a `THREE.Group` that allows
 * you to dynamically turn on/off multiplayer visibility.
 *
 * Override {@link Peers.packInfo} to customize the information that is sent to other peers.
 *
 * TODO-DOC
 *
 * # Example
 * ```ts
 * // Create a peers manager.
 * const peers = new VOXELIZE.Peers<VOXELIZE.Character>();
 *
 * // Add the peers group to the world.
 * world.add(peers);
 *
 * // Define what a new peer looks like.
 * peers.createPeer = (id) => {
 *   const character = new VOXELIZE.Character();
 *   character.username = id;
 *   return character;
 * };
 *
 * // Define what happens when a peer data is received.
 * peers.onPeerUpdate = (peer, data) => {
 *   peer.set(data.position, data.direction);
 * };
 *
 * // In the render loop, update the peers manager.
 * peers.update();
 * ```
 *
 * ![Example](/img/docs/peers.png)
 *
 * @noInheritDoc
 * @param C The type of the character. Defaults to `Object3D`.
 * @param T The type of peer metadata. Defaults to `{ direction: number[], position: number[] }`.
 * @category Core
 */
export class Peers<
    C extends Object3D = Object3D,
    T = { direction: number[]; position: number[] }
  >
  extends Group
  implements NetIntercept
{
  /**
   * Parameters to customize the peers manager.
   */
  public options: PeersOptions;

  /**
   * The client's own peer ID. This is set when the client first connects to the server.
   */
  public ownID = "";

  /**
   * The client's own username. This is set when the client first connects to the server.
   */
  public ownUsername = "";

  /**
   * The peer object that represents the client themselves. This is set when you call {@link Peers.setOwnPeer}.
   */
  public ownPeer?: C;

  /**
   * A list of packets that will be sent to the server.
   *
   * @hidden
   */
  public packets: MessageProtocol<any, any, any, any>[] = [];

  /**
   * Create a peers manager to add multiplayer functionality to your Voxelize game.
   *
   * @param object The object that is used to send client's own data back to the server.
   * @param options Parameters to customize the effect.
   */
  constructor(public object?: Object3D, options: Partial<PeersOptions> = {}) {
    super();

    this.options = { ...defaultOptions, ...options };
  }

  /**
   * A function called when a new player joins the game. This function should be implemented
   * to create and return a new peer object.
   *
   * @param id The ID of the new peer.
   */
  createPeer: (id: string) => C;

  /**
   * A function called when a player joins the game. By default, the function calls the {@link Peers.createPeer}
   * function to create a new peer object and adds it to the peers group. Customize this function to add additional
   * behavior.
   *
   * @param id The new peer's ID.
   */
  onPeerJoin: (id: string) => void;

  /**
   * A function called to update a peer object with new data. This function should be implemented to
   * customize the behavior of the peer object.
   *
   * @param object The peer object.
   * @param data The new data.
   * @param info The peer's information.
   * @param info.id The peer's ID.
   * @param info.username The peer's username.
   */
  onPeerUpdate: (
    object: C,
    data: T,
    info: { id: string; username: string }
  ) => void;

  /**
   * A function called when a player leaves the game. Internally, when a player leaves, its object is removed
   * from the peers group. Customize this function to add additional behavior.
   *
   * @param id The ID of the peer that left the game.
   */
  onPeerLeave: (id: string) => void;

  /**
   * The network intercept implementation for peers.
   *
   * DO NOT CALL THIS METHOD OR CHANGE IT UNLESS YOU KNOW WHAT YOU ARE DOING.
   *
   * @hidden
   * @param message The message to intercept.
   */
  onMessage = (
    message: MessageProtocol<{ id: string }, T>,
    { username }: { username: string }
  ) => {
    this.ownUsername = username;

    const internalOnJoin = (id: string) => {
      const peer = this.createPeer(id);
      peer.name = id;
      this.add(peer);
      return peer;
    };

    switch (message.type) {
      case "INIT": {
        const { id } = message.json;
        this.ownID = id;
        break;
      }
      case "JOIN": {
        const { text: id } = message;
        if (!this.options.countSelf && (!this.ownID || this.ownID === id))
          return;

        if (!this.createPeer) {
          console.warn("Peers.createPeer is not defined, skipping peer join.");
          return;
        }

        const peer = this.getObjectByName(id);

        if (peer) {
          break;
        }

        internalOnJoin(id);
        this.onPeerJoin?.(id);
        break;
      }
      case "LEAVE": {
        const { text: id } = message;
        const peer = this.getObjectByName(id);

        if (peer) this.remove(peer);

        this.onPeerLeave?.(id);
        break;
      }
      default: {
        break;
      }
    }

    const { peers } = message;

    if (peers) {
      peers.forEach((peer: any) => {
        if (!this.options.countSelf && (!this.ownID || peer.id === this.ownID))
          return;
        if (message.type === "INIT") this.onPeerJoin?.(peer.id);

        let object = this.getObjectByName(peer.id) as C;
        if (!object) {
          object = internalOnJoin(peer.id);
        }

        if (!this.onPeerUpdate) {
          console.warn(
            "Peers.onPeerUpdate is not defined, skipping peer update."
          );
        } else {
          this.onPeerUpdate(object, peer.metadata, {
            id: peer.id,
            username: peer.username,
          });
        }
      });
    }
  };

  /**
   * Set the client's own peer instance.
   *
   * @param peer The peer instance that is going to be the client themselves.
   */
  setOwnPeer(peer: C) {
    this.ownPeer = peer;
    this.add(peer);
  }

  /**
   * Set the client's own username. This will be broadcasted to the server.
   *
   * @param username The username of the client.
   */
  setOwnUsername(username: string) {
    this.ownUsername = username;
  }

  /**
   * Create a packet to send to the server. By default, this function sends the position and direction
   * as metadata to the server. Override this function to customize the information sent.
   *
   * If customized and nothing is returned, no packets will be sent.
   *
   * @returns A peer protocol message
   */
  packInfo(): PeerProtocol<T> | void {
    const {
      x: dx,
      y: dy,
      z: dz,
    } = new Vector3(0, 0, -1)
      .applyQuaternion(this.object.getWorldQuaternion(emptyQ))
      .normalize();
    const { x: px, y: py, z: pz } = this.object.getWorldPosition(emptyP);

    return {
      id: this.ownID,
      username: this.ownUsername,
      metadata: {
        position: [px, py, pz],
        direction: [dx, dy, dz],
      } as any as T,
    } as PeerProtocol<T>;
  }

  /**
   * Get a peer instance by its ID. This uses the `getObjectByName` method of the peers group.
   *
   * @param id The ID of the peer to get.
   * @returns The peer object with the given ID.
   */
  getPeerById = (id: string) => this.getObjectByName(id) as C;

  /**
   * Update the peers manager. Internally, this attempts to call any children that has a `update` method.
   * You can turn this behavior off by setting `options.updateChildren` to `false`.
   *
   * This function should be called in the render loop.
   */
  update() {
    if (!this.object) return;

    const info = this.packInfo();

    if (this.ownPeer && info) {
      this.onPeerUpdate(this.ownPeer, info.metadata, {
        id: info.id,
        username: info.username,
      });
    }

    if (info) {
      const event: MessageProtocol = {
        type: "PEER",
        peers: [info],
      };

      this.packets.push(event);
    }

    if (this.options.updateChildren) {
      this.children.forEach((child) => {
        if (child === this.ownPeer) return;

        if (child instanceof Character) {
          // @ts-ignore
          child.update();
        }
      });
    }
  }
}
