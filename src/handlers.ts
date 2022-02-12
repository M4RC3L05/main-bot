export const handlers = async () => [
  await import("#src/apps/quotes/handler").then(({ handler }) => handler),
  await import("#src/apps/music-player/handler").then(
    ({ MusicPlayerInteractionEventHandler }) =>
      new MusicPlayerInteractionEventHandler().handle,
  ),
];
