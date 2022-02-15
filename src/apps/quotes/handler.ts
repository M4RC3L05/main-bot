import { DiscordEventHandlerAggregator } from "#src/core/interfaces/discord-event-handler-aggregator";
import { DiscordEventHandler } from "#src/core/interfaces/discord-event-handler";
import { QuoteCommandHandler } from "#src/apps/quotes/handlers/quote-command.handler";

export class QuoteEventHandler implements DiscordEventHandlerAggregator {
  handers: Array<DiscordEventHandler<any>> = [];

  constructor() {
    this.handers.push(new QuoteCommandHandler());
  }
}
