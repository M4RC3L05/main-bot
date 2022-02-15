import { Bot } from "#src/bot";
import { handlers } from "#src/handlers";
import { commands } from "#src/commands";

const bot = new Bot(await handlers(), await commands());
await bot.init();
