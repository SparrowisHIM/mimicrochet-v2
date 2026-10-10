"use client";

import { useEffect, useState } from "react";
import { studioSubscribe, studioUnsubscribe } from "@/app/actions/studio";
import { BellIcon } from "@/components/icons";
import { Button, linkClass } from "@/components/ui/button";

// Notifications on Mimi's phones (Figma: Components > Ping card). Android and computers can turn them on
// right here. iPhones only allow it for a page added to the home screen, so there the card says how.

type State = "loading" | "off" | "iphone" | "on" | "blocked" | "unsupported" | "failed";

const isIPhone = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isHomeScreenApp = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const device = () => (isIPhone() ? "iPhone" : /Android/.test(navigator.userAgent) ? "Android" : "Computer");

/** The server's public key (base64url) in the form the browser asks for. */
function keyBytes(base64url: string) {
  const b = atob(base64url.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (base64url.length % 4)) % 4));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

async function currentSubscription() {
  const reg = await navigator.serviceWorker.getRegistration("/studio");
  return (await reg?.pushManager.getSubscription()) ?? null;
}

function Bell({ on }: { on?: boolean }) {
  return (
    <span className={`grid size-9 shrink-0 place-items-center rounded-full ${on ? "bg-emerald-100 text-emerald-800" : "bg-orange-100 text-amber-800"}`}>
      <BellIcon size={20} />
    </span>
  );
}

export function PingCard({ publicKey }: { publicKey: string }) {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      let next: State;
      if (isIPhone() && !isHomeScreenApp()) next = "iphone";
      else if (!supported || !publicKey) next = "unsupported";
      else {
        const sub = await currentSubscription().catch(() => null);
        // Already on: make sure the server still has this phone (it forgets phones that stop answering).
        if (sub) studioSubscribe(sub.toJSON(), device()).catch(() => {});
        next = sub ? "on" : Notification.permission === "denied" ? "blocked" : "off";
      }
      if (alive) setState(next);
    })();
    return () => {
      alive = false;
    };
  }, [publicKey]);

  const turnOn = async () => {
    setBusy(true);
    try {
      // Asked first, straight from the tap: phones only show the question in answer to a tap.
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return setState(permission === "denied" ? "blocked" : "off");
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/studio" });
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) }));
      setState((await studioSubscribe(sub.toJSON(), device(), true)) ? "on" : "failed");
    } catch {
      setState("failed");
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    setBusy(true);
    try {
      const sub = await currentSubscription();
      if (sub) {
        await studioUnsubscribe(sub.endpoint);
        await sub.unsubscribe();
      }
      setState("off");
    } finally {
      setBusy(false);
    }
  };

  if (state === "loading") return null;

  if (state === "on")
    return (
      <div className="flex items-center justify-between gap-3 rounded-[22px] bg-white px-[18px] py-3">
        <span className="flex items-center gap-3 text-[14px] font-medium">
          <Bell on /> Notifications are on
        </span>
        <button type="button" onClick={turnOff} disabled={busy} className={`${linkClass} text-[14px]`}>
          Turn off
        </button>
      </div>
    );

  const body = {
    off: "Your phone tells you the moment a request comes in, or someone says they’ve paid.",
    failed: "That didn’t work. Check you’re online and try again.",
    iphone: "On iPhone, add this page to your home screen first: tap Share, then Add to Home Screen. Open Mimi’s orders from there and turn this on.",
    blocked: "Notifications are blocked for this site. Allow them in this browser’s settings, then come back here.",
    unsupported: "This browser can’t show notifications. Use Chrome on Android, or on iPhone add this page to your home screen.",
  }[state];

  return (
    <div className="flex flex-col gap-3.5 rounded-[22px] bg-white p-[18px]">
      <div className="flex gap-3">
        <Bell />
        <span className="flex flex-col gap-[3px]">
          <span className="text-[15px] font-semibold">Get a ping for new orders</span>
          <span className={`text-[14px] leading-[1.45] ${state === "failed" ? "text-red-700" : "text-stone-600"}`} role={state === "failed" ? "alert" : undefined}>
            {body}
          </span>
        </span>
      </div>
      {(state === "off" || state === "failed") && (
        <Button className="w-full" onClick={turnOn} disabled={busy} aria-busy={busy}>
          Turn on notifications
        </Button>
      )}
    </div>
  );
}
