declare module 'mailparser' {
  export function simpleParser(source: Buffer | string): Promise<any>;
} 