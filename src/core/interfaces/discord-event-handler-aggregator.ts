import { DiscordEventHandler } from "#src/core/interfaces/discord-event-handler";

export interface DiscordEventHandlerAggregator {
  handers: Array<DiscordEventHandler<any>>;
}
