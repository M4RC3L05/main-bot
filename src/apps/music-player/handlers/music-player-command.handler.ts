import { CommandInteraction, Interaction, Message } from "discord.js";
import { DiscordPlayer } from "#src/apps/music-player/player/player";
import { PlayerActions, PlayerSources } from "#src/apps/music-player/commands";
import { AppError } from "#src/core/errors/app.error";
import { playerView } from "#src/apps/music-player/view";
import { StreamSource } from "#src/apps/music-player/player/sources/stream-source";
import { InteractionEventHandler } from "#src/core/interfaces/interaction-event-handler";
import { loggerFactory } from "#src/core/clients/logger";

const logger = loggerFactory("music-player-commands-handler");

export class MusicPlayerCommandHandler implements InteractionEventHandler {
  static #message: Message;

  #discordPlayer: DiscordPlayer;
  #sourceFactory: (sourceType: PlayerSources) => Promise<StreamSource>;

  constructor(
    discordPlayer: DiscordPlayer,
    sourceFactory: (sourceType: PlayerSources) => Promise<StreamSource>,
  ) {
    this.#discordPlayer = discordPlayer;
    this.#sourceFactory = sourceFactory;
  }

  static get message() {
    return MusicPlayerCommandHandler.#message;
  }

  async handle(interaction: CommandInteraction): Promise<void | Interaction> {
    const { commandName } = interaction;

    if (commandName !== "player") return interaction;

    logger.info({ commandName }, "interaction to be handled");

    const playerAction = interaction.options.getSubcommand() as PlayerActions;

    switch (playerAction) {
      case PlayerActions.PLAY: {
        if (MusicPlayerCommandHandler.message) {
          await MusicPlayerCommandHandler.message.delete();
        }

        const playerSource = interaction.options.getString(
          "source",
        ) as PlayerSources;
        const url = interaction.options.getString("url");
        const guild = interaction.client.guilds.cache.get(interaction.guildId);
        const member = guild.members.cache.get(interaction.member.user.id);
        const channel = member.voice.channel;

        await this.#discordPlayer.reset();
        await interaction.reply({ content: `⌛ Loading...` });

        if (url) {
          await this.#discordPlayer.load({
            url,
            source: await this.#sourceFactory(playerSource),
          });
        }

        const music = await this.#discordPlayer.play({ channel });

        MusicPlayerCommandHandler.#message = (await interaction.editReply(
          playerView({
            currentEmoji: "▶️",
            isPaused: false,
            isStopped: false,
            music,
            position: String((await this.#discordPlayer.position()) + 1),
            total: String(await this.#discordPlayer.total()),
          }),
        )) as Message;

        logger.info(
          {
            url,
            channelId: channel.id,
            music,
            messageId: MusicPlayerCommandHandler.#message.id,
          },
          "Playing",
        );

        break;
      }

      case PlayerActions.ADD: {
        const url = interaction.options.getString("url");
        const playerSource = interaction.options.getString(
          "source",
        ) as PlayerSources;

        await interaction.reply({ content: `⌛ Adding...`, ephemeral: true });
        await this.#discordPlayer.add({
          url,
          source: await this.#sourceFactory(playerSource),
        });
        await interaction.editReply({ content: "Done" });

        logger.info({ url }, "Added to queue");
        break;
      }

      case PlayerActions.LIST: {
        const current = this.#discordPlayer.getCursor();
        const items = Array.from(this.#discordPlayer.getQueue()).map(
          ({ title }, index) => `${index === current ? "> " : ""}${title}`,
        );

        await interaction.reply({
          content: items.length <= 0 ? "No items in queue." : items.join("\n"),
          ephemeral: true,
        });

        break;
      }

      default: {
        throw new AppError(
          `Invalid player action: "${playerAction as string}"`,
        );
      }
    }
  }
}
