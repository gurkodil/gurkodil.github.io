import { ensureDir } from "https://deno.land/std@0.119.0/fs/mod.ts";
import {
  decrypt_lottery_file,
  get_latest_lottery_file,
} from "./helpers/utils.ts";
import { execute_lottery_and_create_files } from "./generate_data.ts";
import { parseArgs } from "jsr:@std/cli/parse-args";

const flags = parseArgs(Deno.args, {
  string: ["buildDir", "decryptFile"],
  boolean: ["generateLottery"],
});

const { buildDir, generateLottery = false, decryptFile } = flags;

async function build() {
  if (decryptFile) {
    const decryptedFile = await decrypt_lottery_file(decryptFile);
    console.log(JSON.stringify(decryptedFile, null, 4));
    return;
  }
  try {
    if (generateLottery) {
      await execute_lottery_and_create_files();
    }

    if (!buildDir) {
      console.warn("Missing --buildDir arg, will not build index.html");
      return;
    }

    const year = new Date().getFullYear();

    const encrypted_file = await get_latest_lottery_file();

    const jsonData = await Deno.readTextFile(encrypted_file);

    const htmlTemplate = await Deno.readTextFile("src/index.html");

    const outputHtml = htmlTemplate
      .replace('"{{lottery}}"', jsonData)
      .replace("{{last-updated}}", new Date().toISOString())
      .replace("{{year}}", String(year));

    await ensureDir(buildDir!);
    const outputFile = `${buildDir}/index.html`;
    await Deno.writeTextFile(outputFile, outputHtml);

    console.log(`Built into ${outputFile}.`);
  } catch (error) {
    console.error("Failed", error);
  }
}

build();
