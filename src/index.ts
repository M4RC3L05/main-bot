import { Bot } from "#src/bot.js";
import { handlers } from "#src/handlers.js";
import { commands } from "#src/commands.js";

const bot = new Bot(await handlers(), await commands());
await bot.init();
