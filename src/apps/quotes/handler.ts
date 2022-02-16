import { QuoteCommandHandler } from "#src/apps/quotes/handlers/quote-command.handler.js";
import { DiscordEventHandlerAggregator } from "#src/core/interfaces/discord-event-handler-aggregator.js";
import { DiscordEventHandler } from "#src/core/interfaces/discord-event-handler.js";

export class QuoteEventHandler implements DiscordEventHandlerAggregator {
  handers: Array<DiscordEventHandler<any>> = [];

  constructor() {
    this.handers.push(new QuoteCommandHandler());
  }
}
