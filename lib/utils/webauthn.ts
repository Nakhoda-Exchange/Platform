/**
 * WebAuthn platform-authenticator helpers for the two-step gate (issue #67).
 * Client-only. The credential id is stored on the device (localStorage) —
 * platform credentials are device-bound by nature, so this is semantically
 * where it belongs even after auth sessions land; the server will then also
 * hold the public key and verify assertion signatures (backend work — the
 * mock gate accepts a successful assertion).
 */

const STORAGE_KEY = "biometric_credential";

/** Random challenge bytes. Real challenges come from the backend per attempt. */
function challenge(): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(new ArrayBuffer(32)));
}

function toBase64(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** True when this device can enroll a platform authenticator (Face/Touch ID). */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    if (typeof PublicKeyCredential === "undefined") return false;
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/** True when a credential is already enrolled on this device. */
export function hasBiometricCredential(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

/** Enroll the device biometric; keeps the credential id for the login gate. */
export async function registerBiometric(userName: string): Promise<boolean> {
  try {
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: challenge(),
        rp: { name: "ناخدا" },
        user: {
          id: crypto.getRandomValues(new Uint8Array(new ArrayBuffer(16))),
          name: userName,
          displayName: userName,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // ES256
          { type: "public-key", alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60_000,
      },
    })) as PublicKeyCredential | null;
    if (!credential) return false;
    localStorage.setItem(STORAGE_KEY, toBase64(credential.rawId));
    return true;
  } catch {
    return false; // user cancelled / unsupported
  }
}

/** Ask the device to verify the user against the enrolled credential. */
export async function authenticateBiometric(): Promise<boolean> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: challenge(),
        allowCredentials: [{ type: "public-key", id: fromBase64(stored) }],
        userVerification: "required",
        timeout: 60_000,
      },
    });
    return assertion !== null;
  } catch {
    return false;
  }
}

/** Remove the enrollment from this device. */
export function removeBiometricCredential(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
}
