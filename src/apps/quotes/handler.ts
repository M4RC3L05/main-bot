import { Interaction } from "discord.js";
import { QuoteCommandSource } from "#src/apps/quotes/commands";
import { sourceFactory } from "#src/apps/quotes/sources/source-factory";
import { loggerFactory } from "#src/core/clients/logger";

const logger = loggerFactory("quote-handler");

export const handler = async (
  interaction: Interaction,
): Promise<Interaction | undefined> => {
  if (!interaction.isCommand()) return interaction;

  const { commandName, options } = interaction;

  if (commandName !== "quotes") {
    return interaction;
  }

  logger.info({ commandName }, "interaction to be handled");

  const source = options.getString("source") as QuoteCommandSource;
  const quoteSource = await sourceFactory(source);
  const quote = await quoteSource.getQuote();

  await interaction.reply({
    content: `${quote.from}: _"${quote.text}"_`,
    ephemeral: true,
  });
};
