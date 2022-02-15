import { ClientEvents, Interaction } from "discord.js";
import pino from "pino";
import { REST } from "@discordjs/rest";
import config from "config";
import { Routes } from "discord-api-types/v9";
import { AppError } from "#src/core/errors/app.error";
import { logger } from "#src/core/clients/logger";
import { DiscordEventHandler } from "#src/core/interfaces/discord-event-handler";

export const errorReplyer = async (interaction: Interaction, error: any) => {
  const errorMessage =
    error instanceof AppError ? error.message : "Someting went wrong.";

  await (!(interaction as any).replied &&
  typeof (interaction as any).reply === "function"
    ? (interaction as any as { reply: (value: any) => Promise<void> }).reply({
        content: `💥 ${errorMessage}`,
        ephemeral: true,
      })
    : interaction.channel.send({
        content: `💥 ${errorMessage}`,
        // @ts-expect-error: This is ok.
        ephemeral: true,
      }));
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

    try {
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
    } catch (error: unknown) {
      logger.error(
        {
          error:
            error instanceof Error
              ? pino.stdSerializers.err(error as any)
              : error,
          args,
        },
        "A new error occured while processing interaction",
      );

      if (args.at(0) && args.at(0) instanceof Interaction) {
        await errorReplyer(args.at(0) as Interaction, error);
      }
    }
  };
