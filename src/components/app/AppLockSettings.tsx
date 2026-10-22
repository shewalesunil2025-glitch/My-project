"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { Fingerprint, KeyRound, LockKeyhole, ScanFace } from "lucide-react";
import { LOCK_EVENT, PIN_LENGTH, biometricAvailable, bioName, checkPin, enrollBiometric, getLock, removeBiometric, removePin, setPin, updateLock, validPin, weakPin, type BioKind } from "@/lib/app/appLock";
import { Btn, Field, Notice, PasswordInput, Select } from "./ui";
import { cn } from "@/lib/cn";

const subscribe = (onChange: () => void) => {
  window.addEventListener(LOCK_EVENT, onChange);
  return () => window.removeEventListener(LOCK_EVENT, onChange);
};

const pinInput = (id: string, label: string, autoFocus = false) => (
  <Field label={label} htmlFor={id}>
    <PasswordInput
      id={id}
      name={id}
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

/** One way to open the app: its icon, name, On/Off and its buttons. */
function Way({ icon, title, on, note, children }: { icon: ReactNode; title: string; on: boolean; note: string; children: ReactNode }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3 rounded-2xl border p-3", on ? "border-flow/35 bg-flow/[0.06]" : "border-white/10")}>
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", on ? "bg-flow/15 text-flow" : "bg-white/[0.05] text-fg-muted")}>{icon}</span>
      <div className="min-w-[11rem] flex-1">
        <p className="text-sm font-semibold">
          {title} <span className={cn("ml-1 text-xs font-medium", on ? "text-flow" : "text-fg-subtle")}>· {on ? "On" : "Off"}</span>
        </p>
        <p className="text-xs text-fg-muted">{note}</p>
      </div>
      <div className="ml-auto flex gap-2">{children}</div>
    </div>
  );
}

/** Settings → App lock: the client opens ibaxai on this phone with a PIN, Face ID or fingerprint — any one, or a PIN plus one of the others. */
export function AppLockSettings({ userId, label }: { userId: string; label: string }) {
  const lockJson = useSyncExternalStore(subscribe, () => localStorage.getItem(`ibax-lock:${userId}`) ?? "", () => "");
  const lock = lockJson ? getLock(userId) : null;
  const hasPin = Boolean(lock?.hash);
  const bioOn = lock?.credentialId ? (lock.bioKind ?? "face") : null;
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
    setMsg({ ok: true, text: mode === "change" ? "PIN changed." : "PIN is on. Your account now opens with your PIN." });
  }

  async function onTurnOffPin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const r = await checkPin(userId, read(e, "pin-cur"));
    if (!r.ok) return setMsg({ ok: false, text: "Wrong PIN — it stays on." });
    removePin(userId);
    setMode("");
    setMsg({ ok: true, text: bioOn ? `PIN is off. ${bioName(bioOn)} still opens the app.` : "App lock is off." });
  }

  async function turnOnBio(kind: BioKind) {
    setMsg(null);
    try {
      await enrollBiometric(userId, label, kind);
      setMsg({ ok: true, text: `Done. Your ${bioName(kind)} now opens the app${hasPin ? " (your PIN still works too)" : ""}.` });
    } catch {
      setMsg({ ok: false, text: `The phone didn't confirm your ${bioName(kind)}. Check that it is set up in the phone's settings, then try again.` });
    }
  }

  function turnOffBio() {
    removeBiometric(userId);
    setMsg({ ok: true, text: hasPin ? "Turned off. Your PIN still opens the app." : "App lock is off." });
  }

  const bioWay = (kind: BioKind, icon: ReactNode) => {
    const on = bioOn === kind;
    const name = bioName(kind);
    return (
      <Way
        icon={icon}
        title={name}
        on={on}
        note={!bioOk ? "Not available on this phone or browser." : on ? `Open the app by showing your ${kind === "face" ? "face" : "finger"}.` : `Open the app with your ${name} — no PIN to type.`}
      >
        {on ? (
          <Btn size="sm" variant="ghost" onClick={turnOffBio}>
            Turn off
          </Btn>
        ) : (
          <Btn size="sm" disabled={!bioOk} onClick={() => void turnOnBio(kind)}>
            {bioOn ? `Use ${name}` : `Set up ${name}`}
          </Btn>
        )}
      </Way>
    );
  };

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
        <p className="text-sm text-fg-muted">Choose how ibaxai opens on this phone — a {PIN_LENGTH}-digit PIN, Face ID or your fingerprint — so nobody who picks up your phone can open your account.</p>
      </div>

      <Way icon={<KeyRound className="size-5" aria-hidden />} title={`${PIN_LENGTH}-digit PIN`} on={hasPin} note={hasPin ? "Type your PIN to open the app." : "A secret number only you know."}>
        {hasPin ? (
          <>
            <Btn size="sm" variant="ghost" onClick={() => (setMode("change"), setMsg(null))}>
              Change
            </Btn>
            <Btn size="sm" variant="ghost" onClick={() => (setMode("off"), setMsg(null))}>
              Turn off
            </Btn>
          </>
        ) : (
          mode !== "set" && (
            <Btn size="sm" onClick={() => (setMode("set"), setMsg(null))}>
              Set up PIN
            </Btn>
          )
        )}
      </Way>

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
      {mode === "off" && (
        <form onSubmit={onTurnOffPin} className="space-y-3">
          <div className="sm:max-w-xs">{pinInput("pin-cur", "Enter your PIN to turn it off", true)}</div>
          <div className="flex gap-2">
            <Btn type="submit" size="sm" variant="danger">
              Turn off
            </Btn>
            {cancel}
          </div>
        </form>
      )}

      {bioWay("face", <ScanFace className="size-5" aria-hidden />)}
      {bioWay("fingerprint", <Fingerprint className="size-5" aria-hidden />)}

      {lock && (
        <Field label="Lock again when I leave the app for" htmlFor="lock-after">
          <Select id="lock-after" value={String(lock.after)} onChange={(e) => updateLock(userId, { after: Number(e.target.value) })} className="sm:max-w-xs">
            <option value="0">Any time (lock right away)</option>
            <option value="60">1 minute</option>
            <option value="300">5 minutes</option>
            <option value="900">15 minutes</option>
          </Select>
        </Field>
      )}

      {msg && <Notice tone={msg.ok ? "blue" : "amber"}>{msg.text}</Notice>}
      <p className="text-xs text-fg-subtle">Forgot your PIN, or Face ID / fingerprint doesn&apos;t work? On the lock screen, log in again with your password.</p>
    </div>
  );
}
