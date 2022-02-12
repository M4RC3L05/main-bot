import { Interaction } from "discord.js";
import { sourceFactory } from "#src/apps/music-player/player/sources/source-factory";
import { DiscordPlayer } from "#src/apps/music-player/player/player";
import { MusicPlayerCommandHandler } from "#src/apps/music-player/handlers/music-player-command.handler";
import { MusicPlayerButtonHandler } from "#src/apps/music-player/handlers/music-player-button.handler";
import { playerView } from "#src/apps/music-player/view";
import { InteractionEventHandler } from "#src/core/interfaces/interaction-event-handler";
import { loggerFactory } from "#src/core/clients/logger";

const logger = loggerFactory("music-player-handler");

export class MusicPlayerInteractionEventHandler
  implements InteractionEventHandler
{
  static #discordPlayer = new DiscordPlayer(async () => {
    const { message } = MusicPlayerCommandHandler;
    logger.info(
      { music: await this.#discordPlayer.nowPlaying() },
      "Next music",
    );

    await message.edit(
      playerView({
        currentEmoji: "▶️",
        isPaused: false,
        isStopped: false,
        music: await this.#discordPlayer.nowPlaying(),
        position: String((await this.#discordPlayer.position()) + 1),
        total: String(await this.#discordPlayer.total()),
      }),
    );
  });

  async handle(interaction: Interaction): Promise<void | Interaction> {
    if (interaction.isCommand()) {
      return new MusicPlayerCommandHandler(
        MusicPlayerInteractionEventHandler.#discordPlayer,
        sourceFactory,
      ).handle(interaction);
    }

    if (interaction.isButton()) {
      return new MusicPlayerButtonHandler(
        MusicPlayerInteractionEventHandler.#discordPlayer,
      ).handle(interaction);
    }

    return interaction;
  }
}
