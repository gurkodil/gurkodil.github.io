import { generate_encrypted } from "./helpers/encrypt.ts";
import { generate_new_year } from "./helpers/gifter.ts";
import {
    file_exist,
    get_encrypted_filename,
    get_unencrypted_filename,
    write_sync_formatted_json,
    type SecretSantaRecord,
} from "./helpers/utils.ts";

export const execute_lottery_and_create_files = async () => {
    const unencrypted_filename = get_unencrypted_filename();
    let unencrypted_lottery;
    
    if (await file_exist(unencrypted_filename)) {
        console.warn(`Unencrypted file exists! (${unencrypted_filename})`);
        console.warn("Will use existing file");
        const module = await import(unencrypted_filename, {
            with: { type: "json" },
          });
          unencrypted_lottery = module.default as SecretSantaRecord[];

    } else {
        unencrypted_lottery = await generate_new_year();
        write_sync_formatted_json(unencrypted_filename, unencrypted_lottery);
    }
    
    if (!unencrypted_lottery) {
        throw Error("GENERATION FAILED!");
    }
    const encrypted_filename = get_encrypted_filename();

    if (await file_exist(encrypted_filename)) {
        console.log(`Encrypted file exists! (${encrypted_filename})`);
        return;
    }

    const encrypted_lottery = await generate_encrypted(unencrypted_lottery);

    write_sync_formatted_json(encrypted_filename, encrypted_lottery);
};
