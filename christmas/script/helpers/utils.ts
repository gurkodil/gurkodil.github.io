import { decrypt } from "./encrypt.ts";

type Recipient = { year: number; recipient: string; encrypted?: boolean };

export type SecretSantaRecord = {
  name: string;
  env_secret: string;
  recipients: Recipient[];
};

export type SecretSantaFile = {
  current_year: number;
  records: SecretSantaRecord[];
};

export const getEnvVariableOrThrow = (key: string) => {
  const value = Deno.env.get(key);
  if (value) return value;

  throw new Error(`Could not find env variable with name ${key}`);
};

// deno-lint-ignore no-explicit-any
export const writeSyncFormattedJson = (file_path: string, obj: any) => {
  Deno.writeTextFileSync(file_path, JSON.stringify(obj, null, 4));
  console.log("Wrote file", file_path);
};

export const getSecretSantaFile = (filename: string): SecretSantaFile => {
  const file = Deno.readTextFileSync(filename);

  const santaFile = JSON.parse(file) as unknown as SecretSantaFile;

  if (!santaFile || !santaFile.current_year) {
    throw new Error(`Unexpected file format: ${santaFile}`);
  }
  return santaFile;
};

export const decryptSecretSantaFile = async (
  filename: string,
): Promise<SecretSantaFile> => {
  const santaFile = getSecretSantaFile(filename);

  const records = await Promise.all(santaFile.records.map(async (record) => {
    for (let i = 0; i < record.recipients.length; i++) {
      if (record.recipients[i].encrypted) {
        const secret = Deno.env.get(record.env_secret);
        if (!secret) {
          throw new Error(`Missing ${record.env_secret} environment variable`);
        }
        record.recipients[i].recipient = await decrypt(
          record.recipients[i].recipient,
          secret,
        );
        delete record.recipients[i].encrypted;
      }
    }
    return record;
  }));

  return { ...santaFile, records };
};
