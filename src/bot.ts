import config from "config";
import pino from "pino";
import { Interaction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { discordClient } from "#src/core/clients/discord";
import { logger } from "#src/core/clients/logger";
import { errorReplyer, syncCommands } from "#src/core/utils/discord";
import { AppError } from "#src/core/errors/app.error";

export class Bot {
  #handlers: Array<(interaction: Interaction) => Promise<Interaction | void>>;
  #commands: SlashCommandBuilder[];

  constructor(
    handlers: Array<(interaction: Interaction) => Promise<Interaction | void>>,
    commands: SlashCommandBuilder[],
  ) {
    this.onInteraction = this.onInteraction.bind(
      this,
    ) as typeof this.onInteraction;

    this.#handlers = handlers;
    this.#commands = commands;
  }

  async #login() {
    const token = config.get<string>("discord.bot.token");
    await discordClient.login(token);

    logger.info("Logged in");
  }

  async #ready() {
    await new Promise<void>((resolve) => {
      discordClient.once("ready", () => {
        resolve();
      });
    });

    logger.info("Discord ready");
  }

  async onInteraction(interaction: Interaction) {
    logger.info({ interaction }, "New interaction");

    try {
      let cursor = 0;
      for (const handler of this.#handlers) {
        // eslint-disable-next-line no-await-in-loop
        if ((await handler(interaction)) !== interaction) {
          break;
        }

        cursor += 1;
      }

      if (cursor === this.#handlers.length && interaction.isCommand()) {
        throw new AppError(
          `Could not process interaction \`\`\`${JSON.stringify(
            interaction.toString(),
          )}\`\`\``,
        );
      }
    } catch (error: unknown) {
      logger.error(
        {
          error:
            error instanceof Error
              ? pino.stdSerializers.err(error as any)
              : error,
        },
        "A new error occured while processing interaction",
      );

      await errorReplyer(interaction, error);
    }
  }

  #bindEvents() {
    logger.info("Binding interactionCreate");
    discordClient.on("interactionCreate", this.onInteraction);
  }

  async init() {
    await syncCommands(this.#commands.map((command) => command.toJSON()));
    await this.#login();
    await this.#ready();

    this.#bindEvents();
  }

  async close() {
    discordClient.removeAllListeners();
  }
}
