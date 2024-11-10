import { decrypt } from "./encrypt.ts";

export type SecretSantaRecord = {
  name: string;
  env_secret: string;
  recipients: {
    year: number;
    recipient: string;
    encrypted?: boolean;
  }[];
};

export type NotSecretSantaRecord = {
  name: string;
  env_secret: string;
  recipients: {
    year: number;
    recipient: string;
  }[];
};

const cwd = Deno.cwd();
const lotteryBase = `${cwd}/lottery-json`;

export const get_unencrypted_filename = (
  year: number = new Date().getFullYear(),
) => `${lotteryBase}/data_${year}.json`;

export const get_encrypted_filename = (
  year: number = new Date().getFullYear(),
) => `${lotteryBase}/data_encrypted_${year}.json`;

export const get_latest_lottery_file = async () => {
  const year = new Date().getFullYear();
  const currentYearFile = get_encrypted_filename(year);

  if (await file_exist(currentYearFile)) {
    return currentYearFile;
  }

  const prevYearFile = get_encrypted_filename(year - 1);
  if (await file_exist(currentYearFile)) {
    return prevYearFile;
  }
  throw new Error("No file found for this or prev year!");
};

// deno-lint-ignore no-explicit-any
export const write_sync_formatted_json = (file_path: string, obj: any) => {
  Deno.writeTextFileSync(file_path, JSON.stringify(obj, null, 4));
  console.log("Wrote file", file_path);
};

export const decrypt_lottery_file = async (
  filename: string,
): Promise<NotSecretSantaRecord[]> => {
  const exist = await file_exist(filename);
  if (!exist) {
    throw new Error("File not found!");
  }
  const file = Deno.readTextFileSync(filename);

  const santaRecords = JSON.parse(file) as unknown as SecretSantaRecord[];

  if (!santaRecords || !santaRecords[0]?.name) {
    throw new Error(`Unexpected file format: ${santaRecords}`);
  }

  return Promise.all(santaRecords.map(async (record) => {
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
};

export const file_exist = async (filename: string) => {
  try {
    await Deno.lstat(filename);
    return true;
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      throw err;
    }
    return false;
  }
};
