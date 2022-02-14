import { Readable } from "node:stream";
import { StreamType } from "@discordjs/voice";
import { PlayerSearchTypes } from "#src/apps/music-player/commands";

export type MusicInfo = {
  title?: string;
  thumb?: { url: string; width: number; height: number };
  author?: string;
  url: string;
  stream: () => Promise<{ stream: Readable; type: StreamType }>;
};

export type GetStreamResult = { stream: Readable; type: StreamType };

export type SourceItemGenerator = AsyncGenerator<MusicInfo>;

export interface StreamSource {
  init(): Promise<void>;
  getLinkType(url: string): Promise<"video" | "album" | "track" | "playlist">;
  getPlaylistItems(url: string): Promise<SourceItemGenerator>;
  getInfo(url: string): Promise<SourceItemGenerator>;
  getStream(url: string): Promise<GetStreamResult>;
  search(
    query: string,
    type?: PlayerSearchTypes,
  ): Promise<Array<Omit<MusicInfo, "stream">>>;
}
