import { Interaction } from "discord.js";

export interface InteractionEventHandler {
  handle(interaction: Interaction): Promise<Interaction | void>;
}
