import crypto from "crypto";
import getCryptoKey from "./cryptoKey";

export async function encryptToken(data: unknown): Promise<string> {
    const cryptoKey = await getCryptoKey();

    const subtle =
        typeof window !== "undefined"
            ? window.crypto.subtle
            : (crypto.webcrypto as unknown as Crypto).subtle;

    if (!subtle) {
        throw new Error("Crypto Subtle API is not available in this environment");
    }

    const iv = typeof window !== "undefined"
        ? window.crypto.getRandomValues(new Uint8Array(12))
        : (crypto.webcrypto as unknown as Crypto).getRandomValues(new Uint8Array(12));

    const encodedData = new TextEncoder().encode(JSON.stringify(data));

    const encryptedData = await subtle.encrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        encodedData
    );

    const ivBase64 = typeof window !== "undefined"
        ? btoa(String.fromCharCode(...Array.from(iv)))
        : Buffer.from(iv).toString("base64");

    const encryptedBase64 = typeof window !== "undefined"
        ? btoa(String.fromCharCode(...Array.from(new Uint8Array(encryptedData))))
        : Buffer.from(encryptedData).toString("base64");

    return `${ivBase64}:${encryptedBase64}`;
}

export default encryptToken;
