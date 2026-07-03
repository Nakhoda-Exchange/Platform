"use client";

import Script from "next/script";
import { useEffect } from "react";
import { GOFTINO_WIDGET_ID } from "./goftino";

// Official Goftino loader, parameterized by widget id.
const loader = `!function(){var i="${GOFTINO_WIDGET_ID}",a=window,d=document;function g(){var g=d.createElement("script"),s="https://www.goftino.com/widget/"+i,l=localStorage.getItem("goftino_"+i);g.async=!0,g.src=l?s+"?o="+l:s;d.getElementsByTagName("head")[0].appendChild(g);}"complete"===d.readyState?g():a.attachEvent?a.attachEvent("onload",g):a.addEventListener("load",g,!1);}();`;

/**
 * Loads Goftino and hides its default floating launcher, so support opens only
 * from the header button (`openSupportChat`). While the chat is open it adds a
 * `goftino-open` class to <html> so CSS can show it fullscreen (Goftino has no
 * fullscreen API).
 */
export function GoftinoChat() {
  useEffect(() => {
    const hideIcon = () => window.Goftino?.setWidget({ hasIcon: false });
    const onOpen = () => document.documentElement.classList.add("goftino-open");
    const onClose = () =>
      document.documentElement.classList.remove("goftino-open");

    window.addEventListener("goftino_ready", hideIcon);
    window.addEventListener("goftino_openWidget", onOpen);
    window.addEventListener("goftino_closeWidget", onClose);
    if (window.Goftino) hideIcon(); // widget already loaded on remount

    return () => {
      window.removeEventListener("goftino_ready", hideIcon);
      window.removeEventListener("goftino_openWidget", onOpen);
      window.removeEventListener("goftino_closeWidget", onClose);
    };
  }, []);

  if (!GOFTINO_WIDGET_ID) return null;

  return (
    <Script
      id="goftino-widget"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: loader }}
    />
  );
}
