import { ClientEvents, Interaction } from "discord.js";
import pino from "pino";
import { REST } from "@discordjs/rest";
import config from "config";
import { Routes } from "discord-api-types/v9";
import { AppError } from "#src/core/errors/app.error.js";
import { logger } from "#src/core/clients/logger.js";
import { DiscordEventHandler } from "#src/core/interfaces/discord-event-handler.js";

export const errorReplyer = async (interaction: Interaction, error: any) => {
  const errorMessage =
    error instanceof AppError ? error.message : "Someting went wrong.";
  const replayableInteraction =
    typeof (interaction as any).reply === "function" ||
    typeof (interaction as any).editReply === "function";

  if (replayableInteraction) {
    if ((interaction as any).replied) {
      await (
        interaction as any as { editReply: (value: any) => Promise<void> }
      ).editReply({
        content: `💥 ${errorMessage}`,
        ephemeral: true,
      });
    } else {
      await (
        interaction as any as { reply: (value: any) => Promise<void> }
      ).reply({
        content: `💥 ${errorMessage}`,
        ephemeral: true,
      });
    }
  } else {
    await interaction.user.send({
      content: `💥 ${errorMessage}`,
    });
  }
};

export const syncCommands = async (commands: any[]) => {
  try {
    const botToken = config.get<string>("discord.bot.token");
    const { clientId, guildId } =
      config.get<{ clientId: string; guildId: string }>("discord");
    const rest = new REST({ version: "9" }).setToken(botToken);
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
    });
    logger.info("Commands synced");
  } catch (error: unknown) {
    logger.warn(
      {
        error:
          error instanceof Error
            ? pino.stdSerializers.err(error as any)
            : error,
      },
      "Unable to set commands.",
    );
  }
};

export const handleEvent =
  <K extends keyof ClientEvents>(
    ...handlers: Array<DiscordEventHandler<any>>
  ) =>
  async (...args: ClientEvents[K]) => {
    logger.info({ args }, "New interaction");

    let cursor = 0;

    for (const handler of handlers) {
      // eslint-disable-next-line no-await-in-loop
      if ((await handler.handle(...args)) === true) {
        break;
      }

      cursor += 1;
    }

    if (cursor === handlers.length) {
      throw new AppError(`Could not process event`);
    }
  };
