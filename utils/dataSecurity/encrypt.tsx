import crypto from "crypto";
import getCryptoKey from "./cryptoKey";

export async function encryptData(data: unknown): Promise<string> {
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

    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);

    return typeof window !== "undefined"
        ? btoa(String.fromCharCode(...Array.from(combined)))
        : Buffer.from(combined).toString("base64");
}

export default encryptData;
