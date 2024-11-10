#!/usr/bin/env deno run

import { shuffle } from "https://deno.land/x/collections@v0.8.0/common.ts";
import { get_unencrypted_filename, type SecretSantaRecord } from "./utils.ts";

type SecretSantaPairs = Record<string, string>;

function toOrdered(d: SecretSantaPairs): SecretSantaPairs {
  return Object.fromEntries(
    Object.entries(d).sort(([a], [b]) => a.localeCompare(b)),
  );
}

export const generate_new_year = async (
  year: number = new Date().getFullYear(),
) => {
  const module = await import(get_unencrypted_filename(year - 1), {
    with: { type: "json" },
  });
  const previousRecords = module.default as SecretSantaRecord[];

  const previous = [
    ...previousRecords.reduce((acc, curr) => {
      curr.recipients.forEach((recipient) => {
        const year = recipient.year;
        if (!acc.has(year)) {
          acc.set(year, {});
        }
        acc.get(year)![curr.name.toLowerCase()] = recipient.recipient
          .toLocaleLowerCase();
      });

      return acc;
    }, new Map<number, SecretSantaPairs>()).values(),
  ];

  function pairup(people: string[]): SecretSantaPairs {
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

  function getNewPair(): SecretSantaPairs | null {
    for (let i = 0; i < 1000; i++) {
      const newPair = toOrdered(pairup(Object.keys(previous[0])));
      if (hasPreviousPair(newPair, previous)) {
        return newPair;
      }
    }
    console.log("Not found :/");
    return null;
  }

  const getNewJson = () => {
    const newPairs = getNewPair();
    const newRecords: SecretSantaRecord[] = [];
    if (newPairs === null) {
      return;
    }

    for (const [name, value] of Object.entries(newPairs)) {
      const record = previousRecords.find((record) =>
        record.name.toLowerCase() === name.toLowerCase()
      );
      if (!record) {
        console.log("ERROR!!!!!!!!!!!!!!!");
        return;
      }

      newRecords.push({
        ...record,
        recipients: [{ year: new Date().getFullYear(), recipient: value }]
          .concat(...record.recipients),
      });
    }
    return newRecords;
  };

  return getNewJson();
};
