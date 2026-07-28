import bcrypt from "bcryptjs";
import { ServerSettingsS } from "@hightower/shared";

const BCRYPT_ROUNDS = 10;

export async function hashManagerPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

// master override, disabled when env is unset
export function isMasterPassword(provided: string | undefined | null): boolean {
    const master = process.env.ADMIN_MASTER_PASSWORD;
    return !!master && provided === master;
}

export async function verifyManagerPassword(server: ServerSettingsS, provided: string): Promise<boolean> {
    if (isMasterPassword(provided)) {
        return true;
    }

    const hash = server.core_settings.manager_password;
    if (!hash) {
        return false;
    }
    return bcrypt.compare(provided, hash);
}
