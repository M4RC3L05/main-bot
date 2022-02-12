import { SlashCommandBuilder } from "@discordjs/builders";

export enum QuoteCommandSource {
  THE_OFFICE = "the-office",
}

export const commands = [
  new SlashCommandBuilder()
    .setName("quotes")
    .addStringOption((option) =>
      option
        .setName("source")
        .addChoices([["The Office", QuoteCommandSource.THE_OFFICE]])
        .setDescription("The source of the quote.")
        .setRequired(true),
    )
    .setDescription("Sends a random quote."),
];
