import pino from "pino";

export const loggerFactory = (namespace: string) => pino().child({ namespace });

export const logger = loggerFactory("bot");
