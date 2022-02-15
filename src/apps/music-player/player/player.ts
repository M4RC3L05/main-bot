import {
  AudioPlayer,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  VoiceConnection,
} from "@discordjs/voice";
import { VoiceBasedChannel } from "discord.js";
import { MusicQueue } from "#src/apps/music-player/player/music-queue";
import { PlayerSource } from "#src/apps/music-player/player/sources/player-source";

export class DiscordPlayer {
  #musicQueue: MusicQueue;
  #discordPlayer: AudioPlayer;
  #voiceConnection: VoiceConnection;
  #voiceChannel: VoiceBasedChannel;
  #isPaused = true;
  #isStoped = true;

  constructor(onNext: () => Promise<void>) {
    this.#musicQueue = new MusicQueue();
    this.#discordPlayer = createAudioPlayer();

    this.#discordPlayer.on("stateChange", async (old, ne) => {
      if (
        old.status === "playing" &&
        ne.status === "idle" &&
        !this.#isStoped &&
        !this.#isStoped &&
        (await this.hasNext())
      ) {
        await this.next();

        if (onNext) {
          await onNext();
        }
      }
    });
  }

  #connectToVoiceChannel(channel: VoiceBasedChannel) {
    if (
      !this.#voiceConnection ||
      (this.#voiceConnection.joinConfig.channelId !== channel.id &&
        this.#voiceConnection.joinConfig.guildId !== channel.guildId)
    ) {
      if (this.#voiceConnection) {
        this.#voiceConnection.disconnect();
        this.#voiceConnection.destroy();
        this.#voiceConnection = null;
      }

      this.#voiceConnection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
      });
      this.#voiceChannel = channel;
    }
  }

  getQueue() {
    return this.#musicQueue.getQueue();
  }

  getCursor() {
    return this.#musicQueue.cursor;
  }

  async init() {
    await this.init();
  }

  async reset() {
    this.#isPaused = true;
    this.#isStoped = true;
    this.#musicQueue = new MusicQueue();
    this.#discordPlayer.stop(true);
    this.#voiceChannel = null;

    if (this.#voiceConnection) {
      this.#voiceConnection.disconnect();
      this.#voiceConnection.destroy();
      this.#voiceConnection = null;
    }
  }

  async load({ url, source }: { url: string; source: PlayerSource }) {
    const type = await source.getLinkType(url);

    const items =
      type === "playlist"
        ? await source.getPlaylistItems(url)
        : await source.getInfo(url);

    this.#musicQueue.load(items);
  }

  async add({ url, source }: { url: string; source: PlayerSource }) {
    const type = await source.getLinkType(url);
    const items =
      type === "playlist"
        ? await source.getPlaylistItems(url)
        : await source.getInfo(url);

    this.#musicQueue.add(items);
  }

  async play({ channel }: { channel: VoiceBasedChannel }) {
    this.#isPaused = false;
    this.#isStoped = false;

    this.#connectToVoiceChannel(channel);

    const current = await this.#musicQueue.peek();
    const stream = await current.stream();

    const resource = createAudioResource(stream.stream, {
      inputType: stream.type,
      inlineVolume: true,
    });

    resource.volume.setVolume(0.1);
    this.#voiceConnection.subscribe(this.#discordPlayer);

    this.#discordPlayer.play(resource);

    return current;
  }

  async stop() {
    this.#isStoped = true;
    await this.#musicQueue.start();
    this.#discordPlayer.stop();
  }

  async pause() {
    this.#isPaused = true;
    this.#discordPlayer.pause(true);
  }

  async resume() {
    if (this.#isStoped) {
      await this.play({ channel: this.#voiceChannel });
      return;
    }

    if (this.#isPaused) {
      this.#isPaused = false;
      this.#discordPlayer.unpause();
    }
  }

  async hasNext() {
    return this.#musicQueue.hasNext();
  }

  async next() {
    await this.#musicQueue.next();

    return this.play({ channel: this.#voiceChannel });
  }

  async hasPrevious() {
    return this.#musicQueue.hasPrevious();
  }

  async previous() {
    await this.#musicQueue.previous();

    return this.play({ channel: this.#voiceChannel });
  }

  async nowPlaying() {
    return this.#musicQueue.peek();
  }

  async position() {
    return this.#musicQueue.cursor;
  }

  async total() {
    return this.#musicQueue.total;
  }
}
