"use client";

import { useId, useState } from "react";
import { Chip } from "./Controls";
import {
  DEFAULT_TEXT_FONT_ID,
  TEXT_FONTS,
} from "@/lib/chrome/textCanvas";

interface TextSourcePanelProps {
  open: boolean;
  onClose: () => void;
  onApply: (text: string, fontId: string) => void | Promise<void>;
}

export function TextSourcePanel({ open, onClose, onApply }: TextSourcePanelProps) {
  const textId = useId();
  const fontId = useId();
  const [text, setText] = useState("CHROMIFY");
  const [font, setFont] = useState(DEFAULT_TEXT_FONT_ID);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const apply = async () => {
    const trimmed = text.replace(/\s+/g, " ").trim();
    if (!trimmed) {
      setError("Enter some text first.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await onApply(trimmed, font);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="mt-3 rounded-[14px] border border-[rgba(150,157,166,0.18)] bg-[#1b1e24] px-4 py-4"
      role="region"
      aria-label="Create chrome from text"
    >
      <div className="flex flex-wrap gap-3">
        <div className="min-w-[180px] flex-1">
          <label
            htmlFor={textId}
            className="mb-1.5 block text-[11px] uppercase tracking-[0.08em] text-[#8b93a0]"
          >
            Text
          </label>
          <input
            id={textId}
            type="text"
            value={text}
            maxLength={48}
            onChange={(e) => {
              setText(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void apply();
            }}
            className="w-full rounded-md border border-[rgba(150,157,166,0.3)] bg-[#14161b] px-3 py-2.5 text-sm text-[#dfe3e9] outline-none transition-colors placeholder:text-[#6c7480] focus:border-[rgba(191,220,245,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bfdcf5]"
            placeholder="Type a word or short phrase"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <div className="min-w-[140px] w-[180px]">
          <label
            htmlFor={fontId}
            className="mb-1.5 block text-[11px] uppercase tracking-[0.08em] text-[#8b93a0]"
          >
            Font
          </label>
          <select
            id={fontId}
            value={font}
            onChange={(e) => setFont(e.target.value)}
            className="w-full rounded-md border border-[rgba(150,157,166,0.3)] bg-[#14161b] px-3 py-2.5 text-sm text-[#dfe3e9] outline-none focus:border-[rgba(191,220,245,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bfdcf5]"
          >
            {TEXT_FONTS.map((f) => (
              <option
                key={f.id}
                value={f.id}
                style={{
                  fontFamily: f.cssVar
                    ? `var(${f.cssVar}), ${f.family}`
                    : f.family,
                }}
              >
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-[11px] text-[#e08a8a]">
          {error}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void apply()}
          disabled={busy}
          className="rounded-full border border-[rgba(125,165,205,0.55)] bg-[linear-gradient(115deg,#f5f7f9,#c2c8d0_40%,#ffffff_60%,#a8afb8)] px-5 py-2.5 text-xs font-medium tracking-[0.08em] text-[#14161b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bfdcf5] disabled:cursor-wait disabled:opacity-70"
        >
          {busy ? "Applying…" : "Apply text"}
        </button>
        <Chip onClick={onClose} aria-label="Close text panel">
          Close
        </Chip>
      </div>
    </div>
  );
}
