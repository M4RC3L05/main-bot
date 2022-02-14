import play, { SoundCloudPlaylist, SoundCloudTrack } from "play-dl";
import LRUCache from "lru-cache";
import { AppError } from "#src/core/errors/app.error";
import {
  GetStreamResult,
  MusicInfo,
  SourceItemGenerator,
  StreamSource,
} from "#src/apps/music-player/player/sources/stream-source";
import { loggerFactory } from "#src/core/clients/logger";
import { PlayerSearchTypes } from "#src/apps/music-player/commands";

const logger = loggerFactory("soundcloud-source");

export class SoundCloudSource implements StreamSource {
  static #booted = false;
  static #infoCache = new LRUCache<string, SoundCloudTrack>({ max: 100 });

  static async #getFromCache(url: string, info?: SoundCloudTrack) {
    if (SoundCloudSource.#infoCache.has(url)) {
      logger.info({ url, info }, "Info in cache");
    } else {
      logger.info({ url, info }, "Info not in cache");

      if (!info) {
        logger.info({ url, info }, "No info provided to cache, fething info.");
        info = (await play.soundcloud(url)) as SoundCloudTrack;
      }

      SoundCloudSource.#infoCache.set(url, info);
    }

    return SoundCloudSource.#infoCache.get(url);
  }

  async #getFromStaticCache(url: string, info?: SoundCloudTrack) {
    return SoundCloudSource.#getFromCache(url, info);
  }

  async #validateUrl(url: string) {
    const type = await play.so_validate(url);

    if (!type || (type !== "track" && type !== "playlist")) {
      throw new AppError(`Invalid soundlcloud url "${JSON.stringify(url)}"`);
    }

    return type;
  }

  async init(): Promise<void> {
    if (SoundCloudSource.#booted) {
      return;
    }

    SoundCloudSource.#booted = true;

    const clientId = await play.getFreeClientID();
    await play.setToken({
      soundcloud: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        client_id: clientId,
      },
    });
  }

  async getLinkType(
    url: string,
  ): Promise<"video" | "track" | "album" | "playlist"> {
    return this.#validateUrl(url);
  }

  async getPlaylistItems(url: string): Promise<SourceItemGenerator> {
    logger.info({ url }, "Getting playlist items");

    const info = (await play.soundcloud(url)) as SoundCloudPlaylist;
    const getStream = this.getStream.bind(this) as typeof this.getStream;

    return (async function* () {
      for (const track of await info.all_tracks()) {
        // eslint-disable-next-line no-await-in-loop
        await SoundCloudSource.#getFromCache(track.url, track);

        yield {
          thumb: { url: track.thumbnail, width: 300, height: 300 },
          title: track.name,
          url: track.url,
          stream: async () => getStream(track.url),
        };
      }
    })();
  }

  async getInfo(url: string): Promise<SourceItemGenerator> {
    logger.info({ url }, "Getting track info");

    const info = await this.#getFromStaticCache(url);
    const getStream = this.getStream.bind(this) as typeof this.getStream;

    return (async function* () {
      yield {
        thumb: { url: info.thumbnail, width: 300, height: 300 },
        title: info.name,
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
    type: PlayerSearchTypes,
  ): Promise<Array<Omit<MusicInfo, "stream">>> {
    logger.info({ query, type }, "Searching.");

    if (!query) {
      throw new AppError("No search term provided");
    }

    if (type && !["track", "playlist", "album"].includes(type)) {
      throw new AppError(
        `Invalid search type of "${type}" for soundcloud source`,
      );
    }

    const results = (await play.search(query, {
      // @ts-expect-error this is ok
      source: { soundcloud: type ? `${type}s` : "tracks" },
      fuzzy: true,
      limit: 8,
    })) as SoundCloudTrack[] | SoundCloudPlaylist[];

    return results.map((track: SoundCloudTrack | SoundCloudPlaylist) => ({
      title: track.name,
      url: track.url,
      author: track.user.name,
      thumb:
        track instanceof SoundCloudTrack
          ? { height: 300, width: 300, url: track.thumbnail }
          : undefined,
    }));
  }
}
