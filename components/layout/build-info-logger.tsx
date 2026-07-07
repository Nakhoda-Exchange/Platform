"use client";

import { useEffect } from "react";

const VERSION = process.env.NEXT_PUBLIC_APP_VERSION;
const COMMIT = process.env.NEXT_PUBLIC_COMMIT_SHA;

/** Logs the running build (version + commit) to the console once on load. */
export function BuildInfoLogger() {
  useEffect(() => {
    console.log(
      `%cناخدا%c v${VERSION} · build ${COMMIT}`,
      "font-weight:bold;color:#0023fb",
      "color:inherit",
    );
  }, []);
  return null;
}
