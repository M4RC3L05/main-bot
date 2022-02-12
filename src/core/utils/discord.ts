import { Interaction } from "discord.js";
import pino from "pino";
import { REST } from "@discordjs/rest";
import config from "config";
import { Routes } from "discord-api-types/v9";
import { AppError } from "#src/core/errors/app.error";
import { logger } from "#src/core/clients/logger";

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
