import { ClientEvents } from "discord.js";

export interface DiscordEventHandler<K extends keyof ClientEvents> {
  type: K;
  handle(...args: ClientEvents[K]): Promise<true | void>;
}
