import { Interaction, Message } from "discord.js";
import { PlayerActions } from "#src/apps/music-player/commands.js";
import { DiscordPlayer } from "#src/apps/music-player/player/player.js";
import { playerView } from "#src/apps/music-player/view.js";
import { loggerFactory } from "#src/core/clients/logger.js";
import { DiscordEventHandler } from "#src/core/interfaces/discord-event-handler.js";
import { AppError } from "#src/core/errors/app.error.js";

const logger = loggerFactory("music-player-button-handler");

export class MusicPlayerButtonHandler
  implements DiscordEventHandler<"interactionCreate">
{
  type: "interactionCreate" = "interactionCreate";
  #discordPlayer: DiscordPlayer;
  #playerMessage: {
    setPlayerMessage: (message: Message) => void;
    getPlayerMessage: () => Message;
  };

  constructor(
    discordPlayer: DiscordPlayer,
    playerMessage: {
      setPlayerMessage: (message: Message) => void;
      getPlayerMessage: () => Message;
    },
  ) {
    this.#discordPlayer = discordPlayer;
    this.#playerMessage = playerMessage;
  }

  async handle(interaction: Interaction): Promise<true | void> {
    if (!interaction.isButton()) {
      return;
    }

    const action = interaction.customId as PlayerActions;

    logger.info({ action }, "interaction to be handled");

    switch (action) {
      case PlayerActions.PAUSE: {
        const music = await this.#discordPlayer.nowPlaying();

        await this.#discordPlayer.pause();
        await interaction.update(
          playerView({
            currentEmoji: "⏸️",
            isPaused: true,
            isStopped: false,
            music,
            position: String((await this.#discordPlayer.position()) + 1),
            total: String(await this.#discordPlayer.total()),
          }),
        );

        return true;
      }

      case PlayerActions.RESUME: {
        const music = await this.#discordPlayer.nowPlaying();

        await this.#discordPlayer.resume();
        await interaction.update(
          playerView({
            currentEmoji: "▶️",
            isPaused: false,
            isStopped: false,
            music,
            position: String((await this.#discordPlayer.position()) + 1),
            total: String(await this.#discordPlayer.total()),
          }),
        );

        return true;
      }

      case PlayerActions.STOP: {
        await this.#discordPlayer.stop();

        const music = await this.#discordPlayer.nowPlaying();

        await interaction.update(
          playerView({
            currentEmoji: "⏹️",
            isPaused: true,
            isStopped: true,
            music,
            position: String((await this.#discordPlayer.position()) + 1),
            total: String(await this.#discordPlayer.total()),
          }),
        );

        return true;
      }

      case PlayerActions.NEXT: {
        const music = await this.#discordPlayer.next();

        await interaction.update(
          playerView({
            currentEmoji: "▶️",
            isPaused: false,
            isStopped: false,
            music,
            position: String((await this.#discordPlayer.position()) + 1),
            total: String(await this.#discordPlayer.total()),
          }),
        );

        return true;
      }

      case PlayerActions.PREVIOUS: {
        const music = await this.#discordPlayer.previous();

        await interaction.update(
          playerView({
            currentEmoji: "▶️",
            isPaused: false,
            isStopped: false,
            music,
            position: String((await this.#discordPlayer.position()) + 1),
            total: String(await this.#discordPlayer.total()),
          }),
        );

        return true;
      }

      case PlayerActions.CLOSE: {
        if (this.#playerMessage.getPlayerMessage()) {
          await this.#playerMessage.getPlayerMessage().delete();

          this.#playerMessage.setPlayerMessage(null);
        }

        await this.#discordPlayer.reset();

        return true;
      }

      default: {
        throw new AppError(`Invalid player action: "${action as string}"`);
      }
    }
  }
}
