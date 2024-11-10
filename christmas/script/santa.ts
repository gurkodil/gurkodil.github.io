import { ensureDir } from "https://deno.land/std@0.119.0/fs/mod.ts";
import { decryptSecretSantaFile } from "./helpers/utils.ts";
import { parseArgs } from "jsr:@std/cli/parse-args";
import { createYearlySecretSantaList } from "./helpers/gifter.ts";

type DecryptArgs = { json: string };
type LotteryArgs = { inputJson: string; outputJson: string };
type BuildArgs = { buildDir: string; json: string };

type CommandArgs = {
  decrypt: DecryptArgs;
  lottery: LotteryArgs;
  build: BuildArgs;
};

async function run() {
  const args = parseArgs(Deno.args);

  if (args._.length === 0) {
    console.log(
      "Usage: deno run build.ts <decrypt|lottery|build> [OPTIONS]",
    );
    Deno.exit(1);
  }

  const subcommand = args._[0] as keyof CommandArgs;

  switch (subcommand) {
    case "decrypt": {
      await handleDecryptCommand(args as unknown as DecryptArgs);
      break;
    }
    case "lottery": {
      handleLotteryCommand(args as unknown as LotteryArgs);
      break;
    }
    case "build": {
      handleBuildCommand(args as unknown as BuildArgs);
      break;
    }
    default: {
      console.log(`Unknown subcommand: ${subcommand}`);
    }
  }
}

async function handleDecryptCommand(args: DecryptArgs) {
  const decryptedFile = await decryptSecretSantaFile(
    args.json,
  );
  console.log(JSON.stringify(decryptedFile, null, 4));
}

async function handleLotteryCommand(args: LotteryArgs) {
  await createYearlySecretSantaList(
    args.inputJson,
    args.outputJson ?? args.inputJson,
  );
}

async function handleBuildCommand(args: BuildArgs) {
  const { buildDir, json } = args;
  if (!buildDir) {
    throw Error("Missing required arg --buildDir");
  }
  if (!json) {
    throw Error("Missing required arg --json");
  }
  try {
    const jsonData = await Deno.readTextFile(json);

    const htmlTemplate = await Deno.readTextFile("src/index.html");

    const outputHtml = htmlTemplate
      .replace('"{{lottery}}"', jsonData)
      .replace("{{last-updated}}", new Date().toISOString())
      .replace("{{year}}", String(new Date().getFullYear()));

    await ensureDir(buildDir!);
    const outputJson = `${buildDir}/index.html`;
    await Deno.writeTextFile(outputJson, outputHtml);

    console.log(`Built into ${outputJson}.`);
  } catch (error) {
    console.error("Failed", error);
  }
}

run();
