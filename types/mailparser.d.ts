declare module 'mailparser' {
  export interface AddressObject {
    value: Array<{
      name: string;
      address: string;
    }>;
    text: string;
  }

  export interface ParsedMail {
    from?: AddressObject;
    to?: AddressObject;
    subject?: string;
    text?: string;
    html?: string;
    [key: string]: any;
  }

  export function simpleParser(source: Buffer | string): Promise<ParsedMail>;
} 