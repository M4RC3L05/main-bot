import process from "node:process";
import pino from "pino";

export const loggerFactory = (namespace: string) =>
  pino({ enabled: !(process.env.NODE_ENV === "test") }).child({ namespace });

export const logger = loggerFactory("bot");
