import { DiscordEventHandler } from "#src/core/interfaces/discord-event-handler.js";

export interface DiscordEventHandlerAggregator {
  handers: Array<DiscordEventHandler<any>>;
}
