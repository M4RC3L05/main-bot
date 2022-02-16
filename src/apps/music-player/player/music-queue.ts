import { MusicInfo } from "#src/apps/music-player/player/sources/player-source.js";

export class MusicQueue {
  #queue: MusicInfo[] = [];
  #source: AsyncGenerator<MusicInfo>;
  #cursor = 0;

  getQueue() {
    const queue = this.#queue;
    return (function* () {
      for (const item of queue) {
        yield item;
      }
    })();
  }

  load(iterable: AsyncGenerator<MusicInfo>) {
    this.#source = iterable;
    this.#queue = [];
    this.#cursor = 0;
  }

  add(iterable: AsyncGenerator<MusicInfo>) {
    if (this.#source) {
      const previousSource = this.#source;
      this.#source = (async function* () {
        if (previousSource) {
          yield* previousSource;
        }

        yield* iterable;
      })();
    } else {
      this.#source = iterable;
    }
  }

  get cursor() {
    return this.#cursor;
  }

  get total() {
    return this.#queue.length;
  }

  async #loadMore(ammount = 1) {
    while (ammount > 0) {
      // eslint-disable-next-line no-await-in-loop
      const more = await this.#source.next();

      if (more.done) {
        break;
      }

      this.#queue.push(more.value);

      ammount -= 1;
    }
  }

  async peek() {
    if (this.cursor === 0 && this.#queue.length === 0) {
      await this.#loadMore(10);
    }

    return this.#queue[this.#cursor];
  }

  hasNext() {
    return this.#queue[this.#cursor + 1] !== undefined;
  }

  async next() {
    if (this.#queue[this.#cursor + 2] === undefined) {
      await this.#loadMore(10);
    }

    if (!this.hasNext()) {
      return;
    }

    this.#cursor = Math.min(this.#queue.length - 1, this.#cursor + 1);

    return this.peek();
  }

  hasPrevious() {
    return this.#queue[this.#cursor - 1] !== undefined;
  }

  async previous() {
    if (!this.hasPrevious()) {
      return;
    }

    this.#cursor = Math.max(0, this.#cursor - 1);

    return this.peek();
  }

  async start() {
    this.#cursor = 0;

    return this.peek();
  }

  async end() {
    this.#cursor = Math.max(0, this.#queue.length - 1);

    return this.peek();
  }
}
