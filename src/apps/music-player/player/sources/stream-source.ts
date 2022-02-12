import { Readable } from "node:stream";
import { StreamType } from "@discordjs/voice";
import { MusicInfo } from "#src/apps/music-player/player/music-queue";

export type GetStreamResult = { stream: Readable; type: StreamType };

export type SourceItemGenerator = AsyncGenerator<MusicInfo>;

export interface StreamSource {
  init(): Promise<void>;
  getLinkType(url: string): Promise<"video" | "album" | "track" | "playlist">;
  getPlaylistItems(url: string): Promise<SourceItemGenerator>;
  getInfo(url: string): Promise<SourceItemGenerator>;
  getStream(url: string): Promise<GetStreamResult>;
}
