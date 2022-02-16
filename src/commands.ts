export const commands = async () => [
  ...(await import("#src/apps/quotes/commands.js").then(
    ({ commands }) => commands,
  )),
  ...(await import("#src/apps/music-player/commands.js").then(
    ({ commands }) => commands,
  )),
];
