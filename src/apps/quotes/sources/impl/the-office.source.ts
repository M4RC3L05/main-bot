import fetch from "node-fetch";
import { Quote, QuoteSource } from "#src/apps/quotes/sources/quote-source.js";
import { loggerFactory } from "#src/core/clients/logger.js";

const logger = loggerFactory("the-office-source");

export class TheOfficeSource implements QuoteSource {
  async init(): Promise<void> {
    return Promise.resolve();
  }

  async getQuote(): Promise<Quote> {
    logger.info("Getting quote");

    const {
      data: {
        content,
        character: { firstname: firstName, lastname: lastName },
      },
    } = await fetch("https://officeapi.dev/api/quotes/random").then(
      async (x) =>
        x.json() as Promise<{
          data: {
            content: string;
            character: { firstname: string; lastname: string };
          };
        }>,
    );

    return { text: content, from: `${firstName} ${lastName}` };
  }
}
