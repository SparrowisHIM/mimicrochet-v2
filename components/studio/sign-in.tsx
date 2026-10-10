"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "@/app/actions/studio";
import { Field, inputClass } from "@/components/form/fields";
import { Button } from "@/components/ui/button";

// Mimi's sign-in (Figma: Mimi's orders > Sign in). Once per phone; the server keeps her signed in.
export function StudioSignIn() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tries, setTries] = useState(0);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!password) {
      setError("Type the studio password.");
      setTries((t) => t + 1);
      return;
    }
    setBusy(true);
    const res = await signIn(password).catch(() => ({ ok: false as const, error: "Couldn’t reach the site. Check you’re online." }));
    if (res.ok) return router.refresh();
    setBusy(false);
    setError(res.error);
    setTries((t) => t + 1);
  };

  return (
    <div className="container-page flex justify-center pt-[72px] pb-24 lg:pt-[120px]">
      <form onSubmit={submit} noValidate className="flex w-full max-w-[420px] flex-col gap-4">
        <h1 className="font-serif text-[34px] leading-[1.05] tracking-[-0.01em] lg:text-center lg:text-[48px]">Mimi’s orders</h1>
        <p className="text-[17px] leading-[1.5] text-stone-600 lg:text-center lg:text-[15px]">Sign in once on each phone. It stays signed in.</p>
        <div className="mt-2">
          <Field label="Password" htmlFor="studio-password" error={error} shake={tries}>
            <input
              id="studio-password"
              type="password"
              autoComplete="current-password"
              placeholder="Your studio password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              className={inputClass}
              aria-invalid={Boolean(error)}
            />
          </Field>
        </div>
        <Button type="submit" className="w-full" disabled={busy} aria-busy={busy}>
          Sign in
        </Button>
        <p className="text-[14px] leading-[1.45] text-stone-500 lg:text-center">Forgot the password? Whoever set up the site can set a new one.</p>
      </form>
    </div>
  );
}
