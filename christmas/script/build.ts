import { ensureDir } from "https://deno.land/std@0.119.0/fs/mod.ts";
import { decryptSecretSantaFile } from "./helpers/utils.ts";
import { parseArgs } from "jsr:@std/cli/parse-args";
import { createYearlySecretSantaList } from "./helpers/gifter.ts";

const flags = parseArgs(Deno.args, {
  string: ["buildDir", "jsonFile", "decryptFile", "jsonOutFile"],
  boolean: ["lottery"],
});

const {
  buildDir,
  lottery = false,
  decryptFile,
  jsonFile,
  jsonOutFile,
} = flags;

async function build() {
  if (decryptFile) {
    const decryptedFile = await decryptSecretSantaFile(decryptFile);
    console.log(JSON.stringify(decryptedFile, null, 4));
    return;
  }
  if (!jsonFile) {
    console.log("Missing --jsonFile");
    return;
  }
  try {
    if (lottery) {
      await createYearlySecretSantaList(
        jsonFile,
        jsonOutFile ?? jsonFile,
      );
    }

    if (!buildDir) {
      console.warn("Missing --buildDir arg, will not build index.html");
      return;
    }

    const jsonData = await Deno.readTextFile(jsonFile);

    const htmlTemplate = await Deno.readTextFile("src/index.html");

    const outputHtml = htmlTemplate
      .replace('"{{lottery}}"', jsonData)
      .replace("{{last-updated}}", new Date().toISOString())
      .replace("{{year}}", String(new Date().getFullYear()));

    await ensureDir(buildDir!);
    const outputFile = `${buildDir}/index.html`;
    await Deno.writeTextFile(outputFile, outputHtml);

    console.log(`Built into ${outputFile}.`);
  } catch (error) {
    console.error("Failed", error);
  }
}

build();
