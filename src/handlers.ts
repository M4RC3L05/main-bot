export const handlers = async () => [
  ...(await import("#src/apps/quotes/handler").then(
    ({ QuoteEventHandler }) => new QuoteEventHandler().handers,
  )),
  ...(await import("#src/apps/music-player/handler").then(
    ({ MusicPlayerEventHandler }) => new MusicPlayerEventHandler().handers,
  )),
];
