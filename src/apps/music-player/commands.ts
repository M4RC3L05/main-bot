import { SlashCommandBuilder } from "@discordjs/builders";

export enum PlayerSources {
  YOUTUBE = "youtube",
  SOUNDCLOUD = "soundcloud",
}

export enum PlayerActions {
  PLAY = "play",
  ADD = "add",
  LIST = "list",
  CLOSE = "close",
  STOP = "stop",
  RESUME = "resume",
  PAUSE = "pause",
  NEXT = "next",
  PREVIOUS = "previous",
}

export const commands = [
  new SlashCommandBuilder()
    .setName("player")
    .setDescription("Play Music")
    .addSubcommand((input) =>
      input
        .setName(PlayerActions.PLAY)
        .setDescription("Play and load.")
        .addStringOption((option) =>
          option
            .setName("source")
            .setDescription("Music player source")
            .addChoices([
              ["Youtube", PlayerSources.YOUTUBE],
              ["Soundcloud", PlayerSources.SOUNDCLOUD],
            ]),
        )
        .addStringOption((option) =>
          option.setName("url").setDescription("Resource url"),
        ),
    )
    .addSubcommand((input) =>
      input
        .setName(PlayerActions.ADD)
        .setDescription("Add to the queue")
        .addStringOption((option) =>
          option
            .setName("source")
            .setDescription("Music player source")
            .addChoices([
              ["Youtube", PlayerSources.YOUTUBE],
              ["Soundcloud", PlayerSources.SOUNDCLOUD],
            ])
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("url")
            .setDescription("Resource url")
            .setRequired(true),
        ),
    )
    .addSubcommand((input) =>
      input.setName(PlayerActions.LIST).setDescription("List queue"),
    ),
];
