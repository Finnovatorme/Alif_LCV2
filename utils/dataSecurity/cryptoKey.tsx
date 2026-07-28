import crypto from "crypto";

export async function getCryptoKey(): Promise<CryptoKey> {
  const secretKey = process.env.SECRET_KEY;
  if (!secretKey) {
    throw new Error("SECRET_KEY is not defined in environment variables");
  }

  const secretKeyBuffer = new Uint8Array(Buffer.from(secretKey, "hex"));

  // Check if we are in a browser environment (window or self)
  const subtle =
    typeof window !== "undefined"
      ? window.crypto.subtle
      : (crypto.webcrypto as unknown as Crypto).subtle;

  if (!subtle) {
    throw new Error("Crypto Subtle API is not available in this environment");
  }

  return subtle.importKey(
    "raw",
    secretKeyBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

export default getCryptoKey;
