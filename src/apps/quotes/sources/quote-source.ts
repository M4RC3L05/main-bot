export type Quote = {
  text: string;
  from: string;
};

export interface QuoteSource {
  init(): Promise<void>;
  getQuote(): Promise<Quote>;
}
