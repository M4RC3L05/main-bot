import { PlayerSources } from "#src/apps/music-player/commands.js";
import { SoundCloudSource } from "#src/apps/music-player/player/sources/impl/soundcloud.source.js";
import { YoutubeSource } from "#src/apps/music-player/player/sources/impl/youtube.source.js";
import { PlayerSource } from "#src/apps/music-player/player/sources/player-source.js";
import { loggerFactory } from "#src/core/clients/logger.js";
import { AppError } from "#src/core/errors/app.error.js";

const logger = loggerFactory("music-player-source-factory");

export const sourceFactory = async (
  source: PlayerSources,
): Promise<PlayerSource> => {
  logger.info({ source }, "Resolving source");

  switch (source) {
    case PlayerSources.YOUTUBE: {
      const ytSource = new YoutubeSource();
      await ytSource.init();

      return ytSource;
    }

    case PlayerSources.SOUNDCLOUD: {
      const soSource = new SoundCloudSource();
      await soSource.init();

      return soSource;
    }

    default: {
      throw new AppError(`Invalid player source: "${source as string}"`);
    }
  }
};
