#!/usr/bin/env deno run

import type { SecretSantaRecord } from "../helpers/utils.ts";

const genSecrets = () =>
  [
    "annika",
    "elin",
    "gustaf",
    "johan",
    "magnus",
    "olivia",
    "per",
  ].map((name) => {
    const env_var_name = `${name.toUpperCase()}_SECRET_KEY`;
    const secretKey = Deno.env.get(env_var_name);
    if (!secretKey) {
      console.log('Missing "secret"!', env_var_name);
      Deno.exit(1);
    }
    return {
      name,
      secretKey,
    };
  });

async function deriveKey(
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const enc = new TextEncoder().encode(password);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc,
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encrypt(data: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);

  const encodedData = new TextEncoder().encode(data);

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    encodedData,
  );

  const result = new Uint8Array([
    ...salt,
    ...iv,
    ...new Uint8Array(encryptedData),
  ]);
  return btoa(String.fromCharCode(...result));
}

export async function decrypt(encryptedData: string, password: string) {
  try {
    const data = Uint8Array.from(
      atob(encryptedData),
      (c) => c.charCodeAt(0),
    );
    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const encrypted = data.slice(28);

    const key = await deriveKey(password, salt);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encrypted,
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    throw new Error("Fel nyckel eller korrupt data");
  }
}

export const generate_encrypted = async (records: SecretSantaRecord[]) => {
  const year = new Date().getFullYear();

  const newRecord = await Promise.all(records.map(async (record) => {
    for (let i = 0; i < record.recipients.length; i++) {
      const recipient = record.recipients[i];
      if (recipient.year === year) {
        const data = await encrypt(
          recipient.recipient,
          genSecrets().find((x) => x.name === record.name)!.secretKey,
        );
        record.recipients[i] = {
          ...recipient,
          encrypted: true,
          recipient: data,
        };
      }
    }
    return record;
  }));
  return newRecord;
};
