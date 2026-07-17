const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const QUALITY = 0.82;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(img.src); resolve(img); };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function getResizeDimensions(width, height) {
  if (width <= MAX_WIDTH && height <= MAX_HEIGHT) {
    return { width, height };
  }
  const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

export async function compressImage(file, options = {}) {
  if (!file || !file.type.startsWith("image/")) return file;

  const { quality = QUALITY } = options;

  try {
    const img = await loadImage(file);
    const { width, height } = getResizeDimensions(img.width, img.height);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", quality);
    });

    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

export async function compressImages(files, options = {}) {
  const results = [];
  for (const file of files) {
    results.push(await compressImage(file, options));
  }
  return results;
}
