import { Interaction, ButtonInteraction, Message } from "discord.js";
import { PlayerActions } from "#src/apps/music-player/commands";
import { DiscordPlayer } from "#src/apps/music-player/player/player";
import { AppError } from "#src/core/errors/app.error";
import { playerView } from "#src/apps/music-player/view";
import { InteractionEventHandler } from "#src/core/interfaces/interaction-event-handler";
import { loggerFactory } from "#src/core/clients/logger";

const logger = loggerFactory("music-player-button-handler");

export class MusicPlayerButtonHandler implements InteractionEventHandler {
  #discordPlayer: DiscordPlayer;

  constructor(discordPlayer: DiscordPlayer) {
    this.#discordPlayer = discordPlayer;
  }

  async handle(interaction: ButtonInteraction): Promise<void | Interaction> {
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

        break;
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

        break;
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

        break;
      }

      case PlayerActions.NEXT: {
        const music = await this.#discordPlayer.next();

        await interaction.update(
          playerView({
            currentEmoji: "⏹️",
            isPaused: false,
            isStopped: false,
            music,
            position: String((await this.#discordPlayer.position()) + 1),
            total: String(await this.#discordPlayer.total()),
          }),
        );

        break;
      }

      case PlayerActions.PREVIOUS: {
        const music = await this.#discordPlayer.previous();

        await interaction.update(
          playerView({
            currentEmoji: "⏹️",
            isPaused: false,
            isStopped: false,
            music,
            position: String((await this.#discordPlayer.position()) + 1),
            total: String(await this.#discordPlayer.total()),
          }),
        );

        break;
      }

      case PlayerActions.CLOSE: {
        await (interaction.message as Message).delete();
        await this.#discordPlayer.reset();

        break;
      }

      default: {
        throw new AppError(`Invalid player action: "${action as string}"`);
      }
    }
  }
}
