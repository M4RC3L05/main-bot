import { Message } from "discord.js";
import { MusicPlayerButtonHandler } from "#src/apps/music-player/handlers/music-player-button.handler.js";
import { MusicPlayerCommandHandler } from "#src/apps/music-player/handlers/music-player-command.handler.js";
import { DiscordPlayer } from "#src/apps/music-player/player/player.js";
import { loggerFactory } from "#src/core/clients/logger.js";
import { DiscordEventHandlerAggregator } from "#src/core/interfaces/discord-event-handler-aggregator.js";
import { DiscordEventHandler } from "#src/core/interfaces/discord-event-handler.js";
import { sourceFactory } from "#src/apps/music-player/player/sources/source-factory.js";
import { playerView } from "#src/apps/music-player/view.js";

const logger = loggerFactory("music-player-handler");

export class MusicPlayerEventHandler implements DiscordEventHandlerAggregator {
  #discordPlayer: DiscordPlayer;
  #playerMessage: Message;
  handers: Array<DiscordEventHandler<any>> = [];

  constructor() {
    this.#discordPlayer = new DiscordPlayer(this.onNext.bind(this));

    this.handers.push(
      new MusicPlayerCommandHandler(this.#discordPlayer, sourceFactory, {
        getPlayerMessage: () => this.#playerMessage,
        setPlayerMessage: (message) => {
          this.#playerMessage = message;
        },
      }),
      new MusicPlayerButtonHandler(this.#discordPlayer, {
        getPlayerMessage: () => this.#playerMessage,
        setPlayerMessage: (message) => {
          this.#playerMessage = message;
        },
      }),
    );
  }

  async onNext() {
    logger.info(
      { music: await this.#discordPlayer.nowPlaying() },
      "On next music",
    );

    await this.#playerMessage.edit(
      playerView({
        currentEmoji: "▶️",
        isPaused: false,
        isStopped: false,
        music: await this.#discordPlayer.nowPlaying(),
        position: String((await this.#discordPlayer.position()) + 1),
        total: String(await this.#discordPlayer.total()),
      }),
    );
  }
}
