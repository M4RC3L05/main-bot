import LRUCache from "lru-cache";
import play, { YouTubeChannel, YouTubePlayList, YouTubeVideo } from "play-dl";
import { AppError } from "#src/core/errors/app.error";
import {
  GetStreamResult,
  MusicInfo,
  SourceItemGenerator,
  PlayerSource,
} from "#src/apps/music-player/player/sources/player-source";
import { loggerFactory } from "#src/core/clients/logger";
import { PlayerSearchTypes } from "#src/apps/music-player/commands";

const logger = loggerFactory("youtube-source");

export class YoutubeSource implements PlayerSource {
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

  async init(): Promise<void> {
    return Promise.resolve();
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

  async search(
    query: string,
    type?: PlayerSearchTypes,
  ): Promise<Array<Omit<MusicInfo, "stream">>> {
    logger.info({ query, type }, "Searching.");

    if (!query) {
      throw new AppError("No search term provided");
    }

    if (type && !["video", "playlist", "channel"].includes(type)) {
      throw new AppError(
        `Invalid search type of "${type}" for soundcloud source`,
      );
    }

    const results = (await play.search(query, {
      // @ts-expect-error This is ok.
      source: { youtube: type ?? "video" },
      fuzzy: true,
      limit: 8,
    })) as YouTubeVideo[] | YouTubeChannel[] | YouTubePlayList[];

    return results.map(
      (video: YouTubeVideo | YouTubeChannel | YouTubePlayList) => ({
        title: video instanceof YouTubeChannel ? video.name : video.title,
        url: video.url,
        author:
          video instanceof YouTubeChannel ? video.name : video.channel.name,
        thumb:
          video instanceof YouTubeChannel
            ? video.icons.at(-1)
            : video instanceof YouTubePlayList
            ? video.thumbnail
            : video.thumbnails.at(-1),
      }),
    );
  }
}
