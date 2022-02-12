export const commands = async () => [
  ...(await import("#src/apps/quotes/commands").then(
    ({ commands }) => commands,
  )),
  ...(await import("#src/apps/music-player/commands").then(
    ({ commands }) => commands,
  )),
];
