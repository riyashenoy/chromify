import { ACCEPTED_EXT, ACCEPTED_MIME, MAX_FILE_BYTES } from "./constants";

export class ImageLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageLoadError";
  }
}

function isAcceptedFile(file: File): boolean {
  const mime = file.type.toLowerCase();
  const typeOk = mime ? ACCEPTED_MIME.has(mime) : false;
  const extOk = ACCEPTED_EXT.test(file.name);
  // Some browsers omit MIME for SVG; accept by extension as a fallback.
  return typeOk || extOk;
}

export function validateImageFile(file: File): void {
  if (!isAcceptedFile(file)) {
    throw new ImageLoadError(
      "Unsupported file. Use PNG, SVG, JPEG, or WebP.",
    );
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new ImageLoadError("File is too large. Keep uploads under 8 MB.");
  }
}

/** Load a local image into a canvas via data URL (avoids tainted canvases). */
export function loadImageToCanvas(file: File): Promise<HTMLCanvasElement> {
  validateImageFile(file);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () =>
      reject(new ImageLoadError(`Couldn't read "${file.name}". Try another file.`));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () =>
        reject(
          new ImageLoadError(
            `Couldn't decode "${file.name}" as an image.`,
          ),
        );
      img.onload = () => {
        let iw = img.naturalWidth || img.width || 1024;
        let ih = img.naturalHeight || img.height || 1024;
        if (iw < 1 || ih < 1) {
          iw = 1024;
          ih = 1024;
        }
        const cap = 1400;
        const s = Math.min(1, cap / Math.max(iw, ih));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(iw * s));
        c.height = Math.max(1, Math.round(ih * s));
        const cctx = c.getContext("2d");
        if (!cctx) {
          reject(new ImageLoadError("Could not prepare the image canvas."));
          return;
        }
        cctx.clearRect(0, 0, c.width, c.height);
        cctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function basenameWithoutExt(name: string): string {
  return name.replace(/\.(png|svg|jpe?g|webp)$/i, "") || "chromify";
}
