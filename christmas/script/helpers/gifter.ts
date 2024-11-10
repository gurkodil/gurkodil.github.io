#!/usr/bin/env deno run

import { shuffle } from "https://deno.land/x/collections@v0.8.0/common.ts";
import {
  decryptSecretSantaFile,
  getEnvVariableOrThrow,
  type SecretSantaFile,
  type SecretSantaRecord,
  writeSyncFormattedJson,
} from "./utils.ts";
import { encrypt } from "./encrypt.ts";

type SecretSantaPairs = Record<string, string>;

function toOrdered(d: SecretSantaPairs): SecretSantaPairs {
  return Object.fromEntries(
    Object.entries(d).sort(([a], [b]) => a.localeCompare(b)),
  );
}

function groupByYear(
  records: SecretSantaRecord[],
): { [year: number]: { [name: string]: string } } {
  const result: { [year: number]: { [name: string]: string } } = {};

  records.forEach((record) => {
    record.recipients.forEach(({ year, recipient }) => {
      if (!result[year]) {
        result[year] = {};
      }
      result[year][record.name] = recipient;
    });
  });

  return result;
}

const generateUpdatedYearlySantaPairs = async (
  prevFile: SecretSantaFile,
): Promise<SecretSantaFile> => {
  const year = new Date().getFullYear();
  // should be an easier way, why am i grouping and then throwing it away?
  const pairGroupedByYear = Object.values(groupByYear(prevFile.records));

  console.log("PairGroupedByYear", prevFile);

  function pairUp(people: string[]): SecretSantaPairs {
    shuffle(people);
    const partners = [...people.slice(1), people[0]];
    return Object.fromEntries(people.map((person, i) => [person, partners[i]]));
  }

  function hasPreviousPair(
    newPairs: SecretSantaPairs,
    previousPairs: SecretSantaPairs[],
  ): boolean {
    for (const past of previousPairs) {
      const duplicatePairs = Object.entries(newPairs).filter(
        ([person, partner]) => past[person] === partner,
      );
      if (duplicatePairs.length > 0) {
        return false;
      }
    }
    return true;
  }

  function getNewPair(): SecretSantaPairs {
    for (let i = 0; i < 1000; i++) {
      const newPair = toOrdered(pairUp(Object.keys(pairGroupedByYear[0])));
      if (hasPreviousPair(newPair, pairGroupedByYear)) {
        return newPair;
      }
    }
    throw new Error("Failed to generate new santa pairs!");
  }

  const getNewJson = async () => {
    const newPairs = getNewPair();
    const newRecords: SecretSantaRecord[] = [];

    for (const [name, value] of Object.entries(newPairs)) {
      const record = prevFile.records.find((record) =>
        record.name.toLowerCase() === name.toLowerCase()
      );
      if (!record) {
        throw new Error(`Unexpected error! Could not find ${name}`);
      }

      const secret = getEnvVariableOrThrow(record.env_secret);
      const encryptedRecipient = await encrypt(value, secret);

      newRecords.push({
        ...record,
        recipients: [
          { year, recipient: encryptedRecipient, encrypted: true },
          ...record.recipients,
        ],
      });
    }
    return newRecords;
  };

  return { current_year: year, records: await getNewJson() };
};

export const createYearlySecretSantaList = async (
  previousListFileName: string,
  outFile: string,
) => {
  const file = await decryptSecretSantaFile(previousListFileName);
  const year = new Date().getFullYear();

  if (file.current_year === year) {
    console.warn("This year has already been generated!");
    return;
  }

  const newFile = await generateUpdatedYearlySantaPairs(file);

  writeSyncFormattedJson(outFile, newFile);
};
