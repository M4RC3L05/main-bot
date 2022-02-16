export const handlers = async () => [
  ...(await import("#src/apps/quotes/handler.js").then(
    ({ QuoteEventHandler }) => new QuoteEventHandler().handers,
  )),
  ...(await import("#src/apps/music-player/handler.js").then(
    ({ MusicPlayerEventHandler }) => new MusicPlayerEventHandler().handers,
  )),
];
