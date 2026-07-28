import crypto from "crypto";
import getCryptoKey from "./cryptoKey";

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  // Handle URL-safe base64
  const normalized = base64.replace(/-/g, "+").replace(/_/g, "/");
  const binaryString =
    typeof window !== "undefined"
      ? atob(normalized)
      : Buffer.from(normalized, "base64").toString("binary");

  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function decryptDetails(encryptedDataBase64: string): Promise<any> {
  const cryptoKey = await getCryptoKey();

  const encryptedDataArrayBuffer = base64ToArrayBuffer(encryptedDataBase64);
  const iv = encryptedDataArrayBuffer.slice(0, 12);
  const encryptedData = encryptedDataArrayBuffer.slice(12);

  const subtle =
    typeof window !== "undefined"
      ? window.crypto.subtle
      : (crypto.webcrypto as unknown as Crypto).subtle;

  if (!subtle) {
    throw new Error("Crypto Subtle API is not available in this environment");
  }

  const decryptedData = await subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    cryptoKey,
    encryptedData
  );

  const decodedText = new TextDecoder().decode(decryptedData);

  try {
    const jsonObject = JSON.parse(decodedText);
    // Double JSON parse fallback for nested wrapping
    return typeof jsonObject === "string" ? JSON.parse(jsonObject) : jsonObject;
  } catch (e) {
    return decodedText;
  }
}

export default decryptDetails;
