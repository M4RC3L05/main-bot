import { Interaction, Message, MessageEmbed } from "discord.js";
import { DiscordPlayer } from "#src/apps/music-player/player/player";
import {
  PlayerActions,
  PlayerSearchTypes,
  PlayerSources,
} from "#src/apps/music-player/commands";
import { AppError } from "#src/core/errors/app.error";
import { playerView } from "#src/apps/music-player/view";
import { PlayerSource } from "#src/apps/music-player/player/sources/player-source";
import { loggerFactory } from "#src/core/clients/logger";
import { DiscordEventHandler } from "#src/core/interfaces/discord-event-handler";

const logger = loggerFactory("music-player-commands-handler");

export class MusicPlayerCommandHandler
  implements DiscordEventHandler<"interactionCreate">
{
  #playerMessage: {
    setPlayerMessage: (message: Message) => void;
    getPlayerMessage: () => Message;
  };

  #discordPlayer: DiscordPlayer;
  #sourceFactory: (sourceType: PlayerSources) => Promise<PlayerSource>;
  type: "interactionCreate" = "interactionCreate";

  constructor(
    discordPlayer: DiscordPlayer,
    sourceFactory: (sourceType: PlayerSources) => Promise<PlayerSource>,
    playerMessage: {
      setPlayerMessage: (message: Message) => void;
      getPlayerMessage: () => Message;
    },
  ) {
    this.#discordPlayer = discordPlayer;
    this.#sourceFactory = sourceFactory;
    this.#playerMessage = playerMessage;
  }

  async handle(interaction: Interaction): Promise<true | void> {
    if (!interaction.isCommand()) {
      return;
    }

    const { commandName } = interaction;

    if (commandName !== "player") {
      return;
    }

    logger.info({ commandName }, "interaction to be handled");

    const playerAction = interaction.options.getSubcommand() as PlayerActions;

    switch (playerAction) {
      case PlayerActions.PLAY: {
        if (this.#playerMessage.getPlayerMessage()) {
          await this.#playerMessage.getPlayerMessage().delete();

          this.#playerMessage.setPlayerMessage(null);
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

        const message = (await interaction.editReply(
          playerView({
            currentEmoji: "▶️",
            isPaused: false,
            isStopped: false,
            music,
            position: String((await this.#discordPlayer.position()) + 1),
            total: String(await this.#discordPlayer.total()),
          }),
        )) as Message;
        this.#playerMessage.setPlayerMessage(message);

        logger.info(
          {
            url,
            channelId: channel.id,
            music,
            messageId: message.id,
          },
          "Playing",
        );

        return true;
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
        return true;
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

        return true;
      }

      case PlayerActions.SEARCH: {
        await interaction.deferReply({ ephemeral: true });

        const source = interaction.options.getString("source") as PlayerSources;
        const query = interaction.options.getString("query");
        const type = interaction.options.getString("type") as PlayerSearchTypes;

        const sSource = await this.#sourceFactory(source);
        const results = await sSource.search(query, type);

        await interaction.editReply({
          content: `**Search results for "${query}" on "${
            type
              ? type
              : source === PlayerSources.SOUNDCLOUD
              ? "track"
              : "video"
          }"**${results.length <= 0 ? "\nNo search results" : ""}`,
          embeds: results.map(
            (result) =>
              new MessageEmbed({
                title: result.title,
                thumbnail: result.thumb,
                author: { name: result.author },
                url: result.url,
              }),
          ),
        });

        return true;
      }

      default: {
        throw new AppError(
          `Invalid player action: "${playerAction as string}"`,
        );
      }
    }
  }
}
