import { Interaction } from "discord.js";
import { DiscordEventHandler } from "#src/core/interfaces/discord-event-handler";
import { loggerFactory } from "#src/core/clients/logger";
import { sourceFactory } from "#src/apps/quotes/sources/source-factory";
import { QuoteCommandSource } from "#src/apps/quotes/commands";

const logger = loggerFactory("quote-command-handler");

export class QuoteCommandHandler
  implements DiscordEventHandler<"interactionCreate">
{
  type: "interactionCreate" = "interactionCreate";

  async handle(interaction: Interaction): Promise<true | void> {
    if (!interaction.isCommand()) {
      return;
    }

    const { commandName, options } = interaction;

    if (commandName !== "quotes") {
      return;
    }

    logger.info({ commandName }, "interaction to be handled");

    const source = options.getString("source") as QuoteCommandSource;
    const quoteSource = await sourceFactory(source);
    const quote = await quoteSource.getQuote();

    await interaction.reply({
      content: `${quote.from}: _"${quote.text}"_`,
      ephemeral: true,
    });

    return true;
  }
}
