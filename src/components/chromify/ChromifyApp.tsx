"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { CheckField, Chip, ColorField, SectionTitle, Slider } from "./Controls";
import { TextSourcePanel } from "./TextSourcePanel";
import { SiteFooter, SiteHeader } from "@/components/shared/SiteChrome";
import { DEFAULTS, PRESETS } from "@/lib/chrome/constants";
import { canvasToPngBlob, downloadBlob } from "@/lib/chrome/export";
import {
  basenameWithoutExt,
  ImageLoadError,
  loadImageToCanvas,
} from "@/lib/chrome/loadImage";
import {
  makeStarCanvas,
  paintPreviewBackground,
  renderChrome,
} from "@/lib/chrome/render";
import {
  makeTextCanvas,
  textFilenameSlug,
} from "@/lib/chrome/textCanvas";
import type {
  ChromeParams,
  PresetName,
  PreviewBg,
} from "@/lib/chrome/types";

const PREVIEW_SIZE = 512;
const EXPORT_SIZE = 1200;

function paramsMatch(a: ChromeParams, b: ChromeParams): boolean {
  return (Object.keys(a) as (keyof ChromeParams)[]).every((k) => a[k] === b[k]);
}

export default function ChromifyApp() {
  const [params, setParams] = useState<ChromeParams>(DEFAULTS);
  const [bg, setBg] = useState<PreviewBg>("dark");
  const [fileName, setFileName] = useState("demo-star");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [exportOk, setExportOk] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [srcVersion, setSrcVersion] = useState(0);
  const [textPanelOpen, setTextPanelOpen] = useState(false);

  const srcRef = useRef<HTMLCanvasElement | null>(null);
  const displayRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepth = useRef(0);

  const setParam =
    (key: keyof ChromeParams) =>
    (value: number | string) => {
      setParams((prev) => ({ ...prev, [key]: value }));
    };

  useEffect(() => {
    srcRef.current = makeStarCanvas();
    setSrcVersion(1);
  }, []);

  const handleFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setLoadError(null);
    setExportOk(false);
    try {
      const canvas = await loadImageToCanvas(file);
      srcRef.current = canvas;
      setFileName(basenameWithoutExt(file.name));
      setSrcVersion((v) => v + 1);
    } catch (err) {
      const message =
        err instanceof ImageLoadError
          ? err.message
          : "That image couldn't be loaded. Try a different file.";
      setLoadError(message);
    }
  }, []);

  useEffect(() => {
    if (!srcRef.current) return;
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      if (cancelled) return;
      const disp = displayRef.current;
      if (!disp || !srcRef.current) return;
      const ctx = disp.getContext("2d");
      if (!ctx) return;
      try {
        const result = renderChrome(srcRef.current, PREVIEW_SIZE, params);
        ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
        paintPreviewBackground(ctx, PREVIEW_SIZE, bg);
        ctx.drawImage(result, 0, 0);
      } catch {
        setLoadError("That image couldn't be rendered. Try a different file.");
      }
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [params, bg, srcVersion]);

  const exportPNG = async () => {
    if (!srcRef.current || busy) return;
    setBusy(true);
    setExportOk(false);
    setLoadError(null);
    try {
      await new Promise((r) => setTimeout(r, 20));
      const result = renderChrome(srcRef.current, EXPORT_SIZE, params);
      const blob = await canvasToPngBlob(result);
      downloadBlob(blob, `${fileName}-chrome.png`);
      setExportOk(true);
      window.setTimeout(() => setExportOk(false), 2200);
    } catch {
      setLoadError("Export failed. Try a different file.");
    } finally {
      setBusy(false);
    }
  };

  const resetDefaults = () => {
    setParams({ ...DEFAULTS });
  };

  const restoreDemo = () => {
    srcRef.current = makeStarCanvas();
    setFileName("demo-star");
    setSrcVersion((v) => v + 1);
    setLoadError(null);
  };

  const applyTextSource = async (text: string, fontId: string) => {
    setLoadError(null);
    try {
      const canvas = await makeTextCanvas(text, fontId);
      srcRef.current = canvas;
      setFileName(textFilenameSlug(text));
      setSrcVersion((v) => v + 1);
      setExportOk(false);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Couldn't render that text.",
      );
    }
  };

  const onDragEnter = (e: DragEvent) => {
    e.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  };

  const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    void handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="page-vignette flex min-h-dvh flex-col font-sans text-[#dfe3e9]">
      <SiteHeader title="CHROMIFY" />

      <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-wrap items-start gap-7 px-6 py-7 sm:px-8 sm:py-8">
        <section className="min-w-[280px] flex-1 basis-[420px]" aria-label="Preview">
          <div
            role="region"
            aria-label="Chrome preview. Drop an image to replace the shape."
            onDragEnter={onDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`relative overflow-hidden rounded-[14px] transition-shadow duration-150 motion-reduce:transition-none ${
              dragging
                ? "shadow-[inset_0_0_0_2px_#bfdcf5]"
                : "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)]"
            }`}
          >
            <canvas
              ref={displayRef}
              width={PREVIEW_SIZE}
              height={PREVIEW_SIZE}
              className="block h-auto w-full"
              aria-label={`Chromed preview of ${fileName}`}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void exportPNG();
              }}
              disabled={busy}
              className="absolute right-3 top-3 z-10 rounded-full bg-[linear-gradient(115deg,#f5f7f9,#c2c8d0_40%,#ffffff_60%,#a8afb8)] px-4 py-2 font-sans text-[11px] font-medium tracking-[0.08em] text-[#14161b] shadow-[0_1px_3px_rgba(0,0,0,0.5)] transition-[transform,box-shadow,filter] duration-150 hover:-translate-y-px hover:brightness-105 hover:shadow-[0_2px_6px_rgba(0,0,0,0.5)] active:translate-y-0 active:brightness-95 active:shadow-[0_1px_2px_rgba(0,0,0,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bfdcf5] disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:brightness-100 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              aria-label={`Export ${fileName}-chrome.png`}
            >
              {busy ? "Rendering…" : exportOk ? "Downloaded" : "Export PNG"}
            </button>
            {dragging && (
              <div
                className="absolute inset-0 z-20 grid place-items-center bg-[rgba(20,22,27,0.65)] font-display text-[13px] tracking-[0.14em] text-[#e8f2fc]"
                aria-hidden
              >
                RELEASE TO CHROME IT
              </div>
            )}
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
            <Chip
              onClick={() => fileInputRef.current?.click()}
              className="border-[rgba(150,157,166,0.45)] px-[18px] py-2.5 text-[#dfe3e9]"
              aria-label="Upload PNG, SVG, JPEG, or WebP"
            >
              Upload image
            </Chip>
            <Chip
              active={textPanelOpen}
              onClick={() => setTextPanelOpen((v) => !v)}
              className="border-[rgba(150,157,166,0.45)] px-[18px] py-2.5 text-[#dfe3e9]"
              aria-pressed={textPanelOpen}
              aria-expanded={textPanelOpen}
              aria-label="Create chrome from typed text"
            >
              Text
            </Chip>
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.svg,.jpg,.jpeg,.webp,image/png,image/svg+xml,image/jpeg,image/webp"
              className="sr-only"
              onChange={(e) => {
                void handleFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <Chip onClick={restoreDemo} aria-label="Restore demo star shape">
              Demo star
            </Chip>
          </div>

          <TextSourcePanel
            open={textPanelOpen}
            onClose={() => setTextPanelOpen(false)}
            onApply={applyTextSource}
          />

          {loadError && (
            <p role="alert" className="mt-2.5 text-[11px] text-[#e08a8a]">
              {loadError}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Preview background">
            <span className="mr-0.5 self-center text-[11px] text-[#8b93a0]">
              Preview on
            </span>
            {(
              [
                ["dark", "Dark"],
                ["light", "Light"],
                ["checker", "Checker"],
              ] as const
            ).map(([value, label]) => (
              <Chip
                key={value}
                active={bg === value}
                onClick={() => setBg(value)}
                aria-pressed={bg === value}
              >
                {label}
              </Chip>
            ))}
          </div>
        </section>

        <section
          className="min-w-[260px] flex-1 basis-[300px] rounded-[14px] border border-[rgba(150,157,166,0.18)] bg-[#1b1e24] px-[22px] pb-2.5 pt-5"
          aria-label="Chrome controls"
        >
          <SectionTitle>PRESETS</SectionTitle>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Material presets">
            {(Object.keys(PRESETS) as PresetName[]).map((name) => (
              <Chip
                key={name}
                active={paramsMatch(params, PRESETS[name])}
                onClick={() => setParams({ ...PRESETS[name] })}
                aria-pressed={paramsMatch(params, PRESETS[name])}
              >
                {name}
              </Chip>
            ))}
            <Chip onClick={resetDefaults} aria-label="Reset all settings to defaults">
              Reset
            </Chip>
          </div>

          <SectionTitle>METAL</SectionTitle>
          <div className="mb-3.5 flex flex-wrap gap-2" role="group" aria-label="Edge profile">
            {(
              [
                ["bevel", "Rounded edge"],
                ["bubble", "Full bubble"],
              ] as const
            ).map(([value, label]) => (
              <Chip
                key={value}
                active={params.profile === value}
                onClick={() =>
                  setParams((prev) => ({
                    ...prev,
                    profile: value,
                    bevel:
                      value === "bubble" && prev.bevel < 60 ? 150 : prev.bevel,
                  }))
                }
                aria-pressed={params.profile === value}
              >
                {label}
              </Chip>
            ))}
          </div>
          <Slider
            id="bevel"
            label={params.profile === "bubble" ? "Bubble size" : "Bevel"}
            value={params.bevel}
            min={1}
            max={params.profile === "bubble" ? 260 : 30}
            step={0.5}
            onChange={setParam("bevel")}
          />
          <Slider
            id="depth"
            label="Depth"
            value={params.depth}
            min={0.5}
            max={16}
            step={0.5}
            onChange={setParam("depth")}
          />
          <Slider
            id="contrast"
            label="Contrast"
            value={params.contrast}
            min={0}
            max={1}
            step={0.01}
            onChange={setParam("contrast")}
            format={(v) => `${Math.round(v * 100)}%`}
          />
          <Slider
            id="banding"
            label="Banding"
            value={params.banding}
            min={0}
            max={1}
            step={0.01}
            onChange={setParam("banding")}
            format={(v) => `${Math.round(v * 100)}%`}
          />
          {params.profile === "bubble" && (
            <p className="-mt-1.5 mb-1 text-[11px] leading-relaxed text-[#6c7480]">
              Past the shape&apos;s thickness, bubble size domes the whole form.
              Thin tips still round less than the thick body.
            </p>
          )}

          <SectionTitle>LIGHT</SectionTitle>
          <Slider
            id="shine"
            label="Shine"
            value={params.shine}
            min={0}
            max={1.5}
            step={0.01}
            onChange={setParam("shine")}
            format={(v) => `${Math.round(v * 100)}%`}
          />
          <Slider
            id="lightAngle"
            label="Light angle"
            value={params.lightAngle}
            min={-180}
            max={180}
            step={1}
            onChange={setParam("lightAngle")}
            format={(v) => `${v}°`}
          />
          <Slider
            id="overallTint"
            label="Tint strength"
            value={params.overallTint}
            min={0}
            max={1}
            step={0.01}
            onChange={setParam("overallTint")}
            format={(v) => (v < 0.005 ? "off" : `${Math.round(v * 100)}%`)}
          />
          <Slider
            id="overallHue"
            label="Tint color"
            value={params.overallHue}
            min={0}
            max={360}
            step={1}
            onChange={setParam("overallHue")}
            format={(v) => `${v}°`}
            trackClassName="hue-track"
          />

          <SectionTitle>SHADOW GLOW</SectionTitle>
          <Slider
            id="tintStrength"
            label="Glow strength"
            value={params.tintStrength}
            min={0}
            max={1}
            step={0.01}
            onChange={setParam("tintStrength")}
            format={(v) => (v < 0.005 ? "off" : `${Math.round(v * 100)}%`)}
          />
          <CheckField
            id="tintGradient"
            label="Two-color gradient"
            checked={params.tintGradient}
            onChange={(checked) =>
              setParams((prev) => ({ ...prev, tintGradient: checked }))
            }
          />
          <div className="mb-3.5 flex flex-wrap gap-2">
            <ColorField
              id="tintSky"
              label={params.tintGradient ? "Top" : "Color"}
              value={params.tintSky}
              onChange={setParam("tintSky")}
            />
            {params.tintGradient && (
              <ColorField
                id="tintGround"
                label="Bottom"
                value={params.tintGround}
                onChange={setParam("tintGround")}
              />
            )}
          </div>

          <SectionTitle>SHADOW</SectionTitle>
          <Slider
            id="shadowOpacity"
            label="Opacity"
            value={params.shadowOpacity}
            min={0}
            max={1}
            step={0.01}
            onChange={setParam("shadowOpacity")}
            format={(v) => `${Math.round(v * 100)}%`}
          />
          <Slider
            id="shadowBlur"
            label="Blur"
            value={params.shadowBlur}
            min={0}
            max={40}
            step={1}
            onChange={setParam("shadowBlur")}
          />
          <Slider
            id="shadowDist"
            label="Distance"
            value={params.shadowDist}
            min={0}
            max={40}
            step={1}
            onChange={setParam("shadowDist")}
          />

        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
