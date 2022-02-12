import LRUCache from "lru-cache";
import play, { YouTubeVideo } from "play-dl";
import { AppError } from "#src/core/errors/app.error";
import {
  GetStreamResult,
  SourceItemGenerator,
  StreamSource,
} from "#src/apps/music-player/player/sources/stream-source";
import { loggerFactory } from "#src/core/clients/logger";

const logger = loggerFactory("youtube-source");

export class YoutubeSource implements StreamSource {
  static #infoCache = new LRUCache<string, YouTubeVideo>({ max: 100 });

  static async #getFromCache(url: string, info?: YouTubeVideo) {
    if (YoutubeSource.#infoCache.has(url)) {
      logger.info({ url, info }, "Info in cache");
    } else {
      logger.info({ url, info }, "Info not in cache");

      if (!info) {
        logger.info({ url, info }, "No info provided to cache, fething info.");

        const { video_details: videoDetails } = await play.video_info(url);
        info = videoDetails;
      }

      YoutubeSource.#infoCache.set(url, info);
    }

    return YoutubeSource.#infoCache.get(url);
  }

  async init(): Promise<void> {
    return Promise.resolve();
  }

  async #getFromStaticCache(url: string, info?: YouTubeVideo) {
    return YoutubeSource.#getFromCache(url, info);
  }

  async #validateUrl(url: string) {
    const type = play.yt_validate(url);

    if (!type || (type !== "playlist" && type !== "video")) {
      throw new AppError(`Invalid youtube url "${JSON.stringify(url)}"`);
    }

    return type;
  }

  async getLinkType(
    url: string,
  ): Promise<"video" | "track" | "album" | "playlist"> {
    return this.#validateUrl(url);
  }

  async getPlaylistItems(url: string): Promise<SourceItemGenerator> {
    logger.info({ url }, "Getting playlist items");

    const info = await play.playlist_info(url, { incomplete: true });
    const getStream = this.getStream.bind(this) as typeof this.getStream;

    return (async function* () {
      for (const video of await info.all_videos()) {
        // eslint-disable-next-line no-await-in-loop
        await YoutubeSource.#getFromCache(video.url, video);

        yield {
          thumb: video.thumbnails.at(-1),
          title: video.title,
          url: video.url,
          stream: async () => getStream(video.url),
        };
      }
    })();
  }

  async getInfo(url: string): Promise<SourceItemGenerator> {
    logger.info({ url }, "Getting video info");

    const info = await this.#getFromStaticCache(url);
    const getStream = this.getStream.bind(this) as typeof this.getStream;

    return (async function* () {
      yield {
        thumb: info.thumbnails.at(-1),
        title: info.title,
        url,
        stream: async () => getStream(info.url),
      };
    })();
  }

  async getStream(url: string): Promise<GetStreamResult> {
    logger.info({ url }, "Getting stream");

    await this.#validateUrl(url);

    return play.stream(url);
  }
}