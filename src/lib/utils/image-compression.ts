const acceptedUploadTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const targetUploadSize = 3.5 * 1024 * 1024;
const maxUploadSide = 1800;

export async function compressImageForUpload(file: File) {
  const shouldNormalize =
    file.size > targetUploadSize || !acceptedUploadTypes.has(file.type);

  if (!shouldNormalize) {
    return file;
  }

  try {
    const image = await loadImage(file);
    const scale = Math.min(maxUploadSide / image.width, maxUploadSide / image.height, 1);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d", { alpha: false });

    if (!context) {
      return file;
    }

    image.draw(context, canvas.width, canvas.height);

    for (const quality of [0.9, 0.84, 0.78, 0.72]) {
      const blob = await canvasToJpeg(canvas, quality);

      if (!blob) {
        continue;
      }

      if (blob.size <= targetUploadSize || quality === 0.72) {
        return new File([blob], toJpegFileName(file.name), {
          type: "image/jpeg",
        });
      }
    }

    return file;
  } catch {
    return file;
  }
}

async function loadImage(file: File) {
  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file);

      return {
        width: bitmap.width,
        height: bitmap.height,
        draw: (
          context: CanvasRenderingContext2D,
          width: number,
          height: number,
        ) => {
          context.drawImage(bitmap, 0, 0, width, height);
          bitmap.close();
        },
      };
    } catch {
      // Fall back to HTMLImageElement decoding below.
    }
  }

  const url = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = "async";
  image.src = url;

  try {
    await image.decode();
  } finally {
    URL.revokeObjectURL(url);
  }

  return {
    width: image.naturalWidth || image.width,
    height: image.naturalHeight || image.height,
    draw: (
      context: CanvasRenderingContext2D,
      width: number,
      height: number,
    ) => context.drawImage(image, 0, 0, width, height),
  };
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
}

function toJpegFileName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "") + ".jpg";
}
