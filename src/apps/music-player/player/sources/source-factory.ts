import { PlayerSources } from "#src/apps/music-player/commands";
import { SoundCloudSource } from "#src/apps/music-player/player/sources/impl/soundcloud.source";
import { YoutubeSource } from "#src/apps/music-player/player/sources/impl/youtube.source";
import { StreamSource } from "#src/apps/music-player/player/sources/stream-source";
import { loggerFactory } from "#src/core/clients/logger";
import { AppError } from "#src/core/errors/app.error";

const logger = loggerFactory("music-player-source-factory");

export const sourceFactory = async (
  source: PlayerSources,
): Promise<StreamSource> => {
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
