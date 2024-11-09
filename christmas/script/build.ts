import { ensureDir } from "https://deno.land/std@0.119.0/fs/mod.ts";
import { get_encrypted_filename } from "./helpers/utils.ts";
import { execute_lottery_and_create_files } from "./generate_data.ts";
import { parseArgs } from "jsr:@std/cli/parse-args";

const flags = parseArgs(Deno.args, {
  string: ["buildDir", "basePath"],
});

const { buildDir } = flags;


if (!buildDir) {
    console.error("Missing --buildDir arg")
    Deno.exit(1);
}

async function build() {
    try {
        await execute_lottery_and_create_files();

        const year = new Date().getFullYear();
        const jsonData = await Deno.readTextFile(get_encrypted_filename(year));

        const htmlTemplate = await Deno.readTextFile("src/index.html");

        const outputHtml = htmlTemplate.replace("'{{lottery}}'", jsonData).replace('{{year}}', String(year));

        await ensureDir(buildDir!);
        const outputFile = `${buildDir}/index.html`;
        await Deno.writeTextFile(outputFile, outputHtml);

        console.log(`Built into ${outputFile}.`);
    } catch (error) {
        console.error("Failed", error);
    }
}

build();
