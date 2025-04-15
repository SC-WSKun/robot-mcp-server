import {
  Channel,
  ClientChannelWithoutId,
  FoxgloveClient,
  type Service,
  type ServerInfo,
} from "@foxglove/ws-protocol";
import { parse as parseMessageDefinition } from "@foxglove/rosmsg";
import { MessageReader, MessageWriter } from "@foxglove/rosmsg2-serialization";
import { find } from "lodash";
const _ = require("lodash");
const WebSocket = require("ws");

export class FoxgloveService {
  private static instance: FoxgloveService | null = null;
  private connecting: boolean = false;
  private subs: Map<string, { subId: number; channelId: number }> = new Map();
  connected: boolean = false;
  client: FoxgloveClient | null = null;
  channels: Map<string, Channel> = new Map(); // Map of channels from server advertise
  callbacks: { [key: number]: (timestamp: bigint, data: any) => void } = {}; // Array of subscriptions
  services: Service[] = []; // Array of services from server advertise
  msgEncoding: string = "cdr";
  callServiceId: number = 0; // id of called service
  constructor() {
    const ws_url = "ws://localhost:8765";
    this.initClient(ws_url);
  }

  public static getInstance(): FoxgloveService {
    if (!FoxgloveService.instance) {
      FoxgloveService.instance = new FoxgloveService();
    }
    return FoxgloveService.instance;
  }

  // 建立链接
  async initClient(url: string) {
    const address =
      url.startsWith("ws://") || url.startsWith("wss://") ? url : `ws://${url}`;
    console.log(`Client connecting to ${address}`);
    this.client = new FoxgloveClient({
      ws: new WebSocket(address, [FoxgloveClient.SUPPORTED_SUBPROTOCOL]),
    });

    this.client.on("open", () => {
      console.log("FoxgloveClient Connected Successfully!");
      this.connected = true;
    });

    this.client.on("close", () => {
      console.log("FoxgloveCLient Connection closed");
      this.connecting = false;
      this.connected = false;

      // 重新连接
      this.retryConnection(address);
    });

    this.client.on("error", (error) => {
      console.log("FoxgloveClient error", error);
      this.connecting = false;
      // 重新连接
      this.retryConnection(address);
    });

    this.client.on("advertise", (channels) => {
      for (const channel of channels) {
        this.channels.set(channel.topic, channel);
      }
      console.log(`server channels number: ${this.channels.size}`);
    });

    this.client.on("unadvertise", (channelIds: number[]) => {
      channelIds.forEach((id: number) => {
        for (const [topic, channel] of this.channels.entries()) {
          if (channel.id === id) {
            this.channels.delete(topic);
            break;
          }
        }
      });
      console.log(`current channels: ${this.channels}`);
    });

    this.client.on("advertiseServices", (services: Service[]) => {
      console.log(`receive services:${services?.length}`);
      this.services.push(...services);
    });

    this.client.on("message", ({ subscriptionId, timestamp, data }) => {
      if (this.callbacks[subscriptionId]) {
        this.callbacks[subscriptionId](timestamp, data);
      } else {
        console.log(`No callback for subscriptionId: ${subscriptionId}`);
      }
    });
    this.client.on("serverInfo", (serverInfo: ServerInfo) => {
      if (serverInfo.supportedEncodings) {
        this.msgEncoding = serverInfo.supportedEncodings[0];
      }
    });
  }

  /** subscribe topic
   * @param the name of topic will be subcribed
   * @return id of subcribe channel
   */
  async subscribeTopic(topic: string, advConfig?: any) {
    if (!this.client) {
      return Promise.reject("Client not initialized");
    }

    let channel = find(Array.from(this.channels.values()), { topic });
    if (!channel) {
      if (!advConfig) return Promise.reject("Channel not found");
      const newChannelId = await this.advertiseTopic(advConfig);
      channel = {
        ...advConfig,
        id: newChannelId,
      };
    }
    if (!channel?.id) {
      return Promise.reject("Channel not found");
    }
    // Subscribe to the channel
    const subId = this.client.subscribe(channel.id);

    this.subs.set(topic, {
      subId,
      channelId: channel.id,
    });
    return Promise.resolve(subId);
  }

  advertiseTopic(channel: ClientChannelWithoutId) {
    console.log("--- start advertise topic ---");
    if (!this.client) {
      return Promise.reject("Client not initialized");
    }
    try {
      const channelId = this.client.advertise(channel);
      if (channelId) {
        this.channels.set(channel.topic, {
          ...channel,
          id: channelId,
        } as Channel);
      }
      return Promise.resolve(channelId);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async publishMessage(topic: string, message: any, advConfig?: any) {
    console.log("--- start publish message ---");
    console.debug(`public topic: ${topic}`);
    console.debug(`public message: ${JSON.stringify(message)}`);
    if (!this.client) {
      return Promise.reject("Client not initialized");
    }
    let channel = this.channels.get(topic);
    if (!channel) {
        if (!advConfig) return Promise.reject("Channel not found");
        const newChannelId = await this.advertiseTopic(advConfig);
        channel = {
          ...advConfig,
          id: newChannelId,
        };
    }
    if (!channel?.schema) {
      return Promise.reject("Channel schema is undefined");
    }
    const parseDefinitions = parseMessageDefinition(channel.schema, {
      ros2: true,
    });
    const writer = new MessageWriter(parseDefinitions);
    const uint8Array = writer.writeMessage(message);
    try {
      this.client.sendMessage(channel.id, uint8Array);
      return Promise.resolve("send success");
    } catch (error) {
      console.error("send message fail:", error);
      return Promise.reject("send message fail");
    }
  }

  addHandler(topic: string, callback: (...args: any) => void) {
    if (!this.client) {
      return Promise.reject("foxglove client is not initialized");
    }
    const channel = this.subs.get(topic);
    if (!channel) {
      return Promise.reject("Channel not found");
    }
    if (this.callbacks[channel.subId]) {
      return Promise.reject("Callback already exist");
    }
    this.callbacks[channel.subId] = callback;
    return Promise.resolve(channel.subId);
  }

  readMsgWithSubId(topic: string, data: DataView) {
    const channel = this.channels.get(topic);
    if (!channel) {
      console.debug("channel is undefined");
      return undefined;
    }
    const parseDefinitions = parseMessageDefinition(channel?.schema!, {
      ros2: true,
    });
    const reader = new MessageReader(parseDefinitions);
    if (!data) {
      console.error("data is undefined");
      return undefined;
    }
    return reader.readMessage(data);
  }

  /**
   * call service
   * @param srvName service name
   * @param payload request params
   * @returns a promise wait for the response
   */
  callService(srvName: string, payload?: { [key: string]: any }): Promise<any> {
    if (!this.client) {
      return Promise.reject("Client not initialized!");
    }
    const srv: Service | undefined = _.find(this.services, { name: srvName });

    if (!srv) {
      return Promise.reject("Service not found!");
    }
    const parseReqDefinitions = parseMessageDefinition(srv?.requestSchema!, {
      ros2: true,
    });
    const writer = new MessageWriter(parseReqDefinitions);
    const uint8Array = writer.writeMessage(payload);
    this.client.sendServiceCallRequest({
      serviceId: srv?.id!,
      callId: ++this.callServiceId,
      encoding: this.msgEncoding,
      data: new DataView(uint8Array.buffer),
    });
    return new Promise((resolve) => {
      // 将监听回调函数抽离的目的是避免监听未及时off造成的内存泄漏
      const serviceResponseHandler = (response: any) => {
        const parseResDefinitions = parseMessageDefinition(
          srv?.responseSchema!,
          {
            ros2: true,
          }
        );
        const reader = new MessageReader(parseResDefinitions);
        const res = reader.readMessage(response.data);
        resolve(res);
        this.client?.off("serviceCallResponse", serviceResponseHandler);
      };
      this!.client!.on("serviceCallResponse", serviceResponseHandler);
    });
  }

  /**
   * retry connection
   */
  private retryConnection(url: string) {
    setTimeout(() => {
      if (!this.connecting) {
        this.connecting = true;
        console.log("--- start retry connection ---");
        this.initClient(url);
      }
    }, 10000);
  }
}
