import config from "config";
import { ClientEvents, Interaction } from "discord.js";
import { SlashCommandSubcommandsOnlyBuilder } from "@discordjs/builders";
import pino from "pino";
import { DiscordEventHandler } from "#src/core/interfaces/discord-event-handler.js";
import { logger } from "#src/core/clients/logger.js";
import { discordClient } from "#src/core/clients/discord.js";
import {
  errorReplyer,
  handleEvent,
  syncCommands,
} from "#src/core/utils/discord.js";

export class Bot {
  #handlers: Map<keyof ClientEvents, Array<DiscordEventHandler<any>>>;
  #commands: SlashCommandSubcommandsOnlyBuilder[];

  constructor(
    handlers: Array<DiscordEventHandler<any>>,
    commands: SlashCommandSubcommandsOnlyBuilder[],
  ) {
    this.#handlers = new Map();
    this.#commands = commands;

    for (const handler of handlers) {
      if (!this.#handlers.has(handler.type)) {
        this.#handlers.set(handler.type, []);
      }

      this.#handlers.get(handler.type).push(handler);
    }
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

  #bindEvents() {
    for (const [clientEvent, handlers] of this.#handlers.entries()) {
      logger.info(
        { clientEvent, numberHandlers: handlers.length },
        `Binding ${handlers.length} handlers for ${clientEvent} client event`,
      );

      discordClient.on(clientEvent, async (...args) => {
        try {
          await handleEvent(...handlers)(...args);
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
      });
    }
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
