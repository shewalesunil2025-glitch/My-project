"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { Fingerprint, LockKeyhole } from "lucide-react";
import { LOCK_EVENT, PIN_LENGTH, biometricAvailable, checkPin, enrollBiometric, getLock, removeLock, setPin, updateLock, validPin, weakPin } from "@/lib/app/appLock";
import { Btn, Field, Input, Notice, Select, Toggle } from "./ui";

const subscribe = (onChange: () => void) => {
  window.addEventListener(LOCK_EVENT, onChange);
  return () => window.removeEventListener(LOCK_EVENT, onChange);
};

const pinInput = (id: string, label: string, autoFocus = false) => (
  <Field label={label} htmlFor={id}>
    <Input
      id={id}
      name={id}
      type="password"
      inputMode="numeric"
      autoComplete="off"
      pattern={`\\d{${PIN_LENGTH}}`}
      maxLength={PIN_LENGTH}
      minLength={PIN_LENGTH}
      required
      autoFocus={autoFocus}
      className="tracking-[0.5em]"
    />
  </Field>
);

/** Settings → Security: the client's own PIN, fingerprint or Face ID to open the app on this phone. */
export function AppLockSettings({ userId, label }: { userId: string; label: string }) {
  const lockJson = useSyncExternalStore(subscribe, () => localStorage.getItem(`ibax-lock:${userId}`) ?? "", () => "");
  const lock = lockJson ? getLock(userId) : null;
  const [mode, setMode] = useState<"" | "set" | "change" | "off">("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [bioOk, setBioOk] = useState(false);

  useEffect(() => {
    void biometricAvailable().then(setBioOk);
  }, []);

  const read = (e: FormEvent<HTMLFormElement>, name: string) => String(new FormData(e.currentTarget).get(name) ?? "");

  async function onNewPin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const pin = read(e, "pin-new");
    if (mode === "change" && !(await checkPin(userId, read(e, "pin-cur"))).ok) return setMsg({ ok: false, text: "Your current PIN is wrong." });
    if (!validPin(pin)) return setMsg({ ok: false, text: `The PIN must be ${PIN_LENGTH} digits.` });
    if (weakPin(pin)) return setMsg({ ok: false, text: "That PIN is too easy to guess (like 111111 or 123456). Pick another." });
    if (pin !== read(e, "pin-again")) return setMsg({ ok: false, text: "The two PINs don't match." });
    await setPin(userId, pin);
    setMode("");
    setMsg({ ok: true, text: mode === "change" ? "PIN changed." : "App lock is on. Your account now opens only with your PIN" + (bioOk ? " — or turn on fingerprint / Face ID below." : ".") });
  }

  async function onTurnOff(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const r = await checkPin(userId, read(e, "pin-cur"));
    if (!r.ok) return setMsg({ ok: false, text: "Wrong PIN — app lock stays on." });
    removeLock(userId);
    setMode("");
    setMsg({ ok: true, text: "App lock is off." });
  }

  async function toggleBio(on: boolean) {
    setMsg(null);
    if (!on) return updateLock(userId, { credentialId: undefined });
    try {
      await enrollBiometric(userId, label);
      setMsg({ ok: true, text: "Done. Your fingerprint / Face ID now opens the app too (your PIN still works)." });
    } catch {
      setMsg({ ok: false, text: "The phone didn't confirm your fingerprint / Face ID. Check that one is set up in the phone's settings, then try again." });
    }
  }

  const cancel = (
    <Btn
      size="sm"
      variant="subtle"
      onClick={() => {
        setMode("");
        setMsg(null);
      }}
    >
      Cancel
    </Btn>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-flow/12 text-flow">
          <LockKeyhole className="size-5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold">App lock {lock && <span className="ml-1 text-xs font-medium text-flow">· On</span>}</p>
          <p className="text-sm text-fg-muted">
            Open ibaxai on this phone only with your {PIN_LENGTH}-digit PIN{bioOk ? ", fingerprint or Face ID" : ""} — so nobody who picks up your phone can open your account.
          </p>
        </div>
      </div>

      {!lock && mode !== "set" && (
        <Btn size="sm" onClick={() => (setMode("set"), setMsg(null))}>
          Turn on app lock
        </Btn>
      )}

      {(mode === "set" || mode === "change") && (
        <form onSubmit={onNewPin} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            {mode === "change" && pinInput("pin-cur", "Current PIN", true)}
            {pinInput("pin-new", mode === "change" ? "New PIN" : `Choose a ${PIN_LENGTH}-digit PIN`, mode === "set")}
            {pinInput("pin-again", "Enter it again")}
          </div>
          <div className="flex gap-2">
            <Btn type="submit" size="sm">
              {mode === "change" ? "Change PIN" : "Turn on"}
            </Btn>
            {cancel}
          </div>
        </form>
      )}

      {lock && mode === "" && (
        <div className="space-y-3">
          {bioOk ? (
            <div className="flex items-center gap-2">
              <Fingerprint className="size-5 shrink-0 text-flow" aria-hidden />
              <div className="flex-1">
                <Toggle label="Also unlock with fingerprint / Face ID" checked={Boolean(lock.credentialId)} onChange={(v) => void toggleBio(v)} />
              </div>
            </div>
          ) : (
            <p className="text-xs text-fg-subtle">This phone or browser doesn&apos;t offer fingerprint / Face ID to apps — your PIN keeps the account safe.</p>
          )}
          <Field label="Lock again when I leave the app for" htmlFor="lock-after">
            <Select id="lock-after" value={String(lock.after)} onChange={(e) => updateLock(userId, { after: Number(e.target.value) })} className="sm:max-w-xs">
              <option value="0">Any time (lock right away)</option>
              <option value="60">1 minute</option>
              <option value="300">5 minutes</option>
              <option value="900">15 minutes</option>
            </Select>
          </Field>
          <div className="flex flex-wrap gap-2">
            <Btn size="sm" variant="ghost" onClick={() => (setMode("change"), setMsg(null))}>
              Change PIN
            </Btn>
            <Btn size="sm" variant="danger" onClick={() => (setMode("off"), setMsg(null))}>
              Turn off app lock
            </Btn>
          </div>
        </div>
      )}

      {mode === "off" && (
        <form onSubmit={onTurnOff} className="space-y-3">
          <div className="sm:max-w-xs">{pinInput("pin-cur", "Enter your PIN to turn the lock off", true)}</div>
          <div className="flex gap-2">
            <Btn type="submit" size="sm" variant="danger">
              Turn off
            </Btn>
            {cancel}
          </div>
        </form>
      )}

      {msg && <Notice tone={msg.ok ? "blue" : "amber"}>{msg.text}</Notice>}
      <p className="text-xs text-fg-subtle">Forgot your PIN? On the lock screen, log in again with your password and set a new one.</p>
    </div>
  );
}
