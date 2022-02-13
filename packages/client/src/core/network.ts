import { protocol } from "@voxelize/common";
import URL from "domurl";
import Pako from "pako";
import { Instance as PeerInstance } from "simple-peer";
// @ts-ignore
import SimplePeer from "simple-peer/simplepeer.min";

import { Client } from "..";

const { Message } = protocol;

type CustomWebSocket = WebSocket & {
  sendEvent: (event: any) => void;
};

type NetworkParams = {
  serverURL: string;
  reconnectTimeout: number;
};

type QueryParams = {
  [key: string]: any;
};

class Network {
  public ws: CustomWebSocket;

  public id: string;
  public url: URL<QueryParams>;
  public room: string;
  public socket: URL<QueryParams>;
  public connected = false;

  private reconnection: any;

  constructor(public client: Client, public params: NetworkParams) {
    this.url = new URL(this.params.serverURL);
  }

  connect = async (room: string) => {
    // if websocket connection already exists, disconnect it
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onmessage = null;
      this.ws.close();

      if (this.reconnection) {
        clearTimeout(this.reconnection);
      }
    }

    // set url query
    this.url.query.room = room;

    this.socket = new URL(this.url.toString());
    this.socket.query.room = room;
    this.socket.protocol = this.socket.protocol.replace(/http/, "ws");
    this.socket.hash = "";

    // initialize a websocket connection to socket
    const ws = new WebSocket(this.socket.toString()) as CustomWebSocket;
    ws.binaryType = "arraybuffer";
    // custom Protobuf event sending
    ws.sendEvent = (event: any) => {
      ws.send(Network.encode(event));
    };
    ws.onopen = () => {
      this.connected = true;
      this.client.emit("connected");
      clearTimeout(this.reconnection);
    };
    ws.onerror = console.error;
    ws.onmessage = this.onMessage;
    ws.onclose = () => {
      this.connected = false;
      // fire reconnection every "reconnectTimeout" ms
      this.reconnection = setTimeout(() => {
        this.connect(room);
      }, this.params.reconnectTimeout);
    };

    this.ws = ws;
    this.room = room;
  };

  disconnect = () => {
    this.ws.onclose = null;
    this.ws.onmessage = null;
    this.ws.close();

    this.client.emit("disconnected");

    if (this.reconnection) {
      clearTimeout(this.reconnection);
    }
  };

  fetch = async (path: string, query: { [key: string]: any } = {}) => {
    const stage = this.url.toString();

    if (!path.startsWith("/")) path = `/${path}`;
    this.url.path = path;

    Object.keys(query).forEach((key) => {
      this.url.query[key] = query[key];
    });
    const result = await fetch(this.url.toString());

    this.url = new URL(stage);

    return result.json();
  };

  private onEvent = (event: any) => {
    const { type } = event;

    switch (type) {
      case "INIT": {
        const {
          peers,
          json: { id },
        } = event;

        this.id = id;

        // if any other peers exist on load:
        // try to reach out to them as an initiator
        if (peers) {
          peers.forEach((i: string) => {
            this.connectToPeer(i, true);
          });
        }

        break;
      }
      case "JOIN": {
        // if a new peer joined, connect to them passively,
        // as they would have already tried to reach out
        const { text: id } = event;
        this.connectToPeer(id);

        break;
      }
      case "SIGNAL": {
        const {
          json: { id, signal },
        } = event;
        const { connection } = this.client.peers.get(id) || {};

        // receiving signal from another peer
        if (connection && !connection.destroyed) {
          connection.signal(signal);
        }
        break;
      }
    }
  };

  private onMessage = ({ data }: MessageEvent) => {
    let event: any;
    try {
      event = Network.decode(new Uint8Array(data));
    } catch (e) {
      return;
    }
    this.onEvent(event);
  };

  private connectToPeer = (id: string, initiator = false) => {
    const connection = new SimplePeer({
      initiator,
      trickle: false,
      channelName: this.room,
    }) as PeerInstance;
    this.client.peers.addPeer(id, connection);
  };

  static decode = (buffer: any) => {
    if (buffer[0] === 0x78 && buffer[1] === 0x9c) {
      buffer = Pako.inflate(buffer);
    }
    const message = Message.decode(buffer);
    // @ts-ignore
    message.type = Message.Type[message.type];
    if (message.json) {
      message.json = JSON.parse(message.json);
    }
    return message;
  };

  static encode(message: any) {
    if (message.json) {
      message.json = JSON.stringify(message.json);
    }
    message.type = Message.Type[message.type];
    return protocol.Message.encode(protocol.Message.create(message)).finish();
  }
}

export type { NetworkParams };

export { Network };