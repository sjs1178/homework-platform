// 업로드 전 클라이언트 측 이미지 리사이즈·압축.
// Vercel 서버리스 요청 본문 한도(4.5MB)와 AI 이미지 용량 제한을 넘지 않도록
// 큰 폰 사진을 줄여 여러 장을 함께 보낼 수 있게 한다.

export interface CompressedImage {
  base64: string;
  mediaType: "image/jpeg";
  preview: string;
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("이미지를 불러오지 못했어요"));
    img.src = src;
  });
}

export async function compressImageFile(
  file: File,
  maxDim = 1800,
  quality = 0.82
): Promise<CompressedImage> {
  const dataUrl = await readAsDataURL(file);

  // 압축 불가 환경 등에서는 원본 사용 (fallback)
  const fallback: CompressedImage = {
    base64: dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl,
    mediaType: "image/jpeg",
    preview: dataUrl,
  };

  try {
    const img = await loadImage(dataUrl);
    let { width, height } = img;
    if (!width || !height) return fallback;

    if (width > maxDim || height > maxDim) {
      const scale = maxDim / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return fallback;

    ctx.drawImage(img, 0, 0, width, height);
    const out = canvas.toDataURL("image/jpeg", quality);
    if (!out.startsWith("data:image/jpeg")) return fallback;

    return { base64: out.split(",")[1], mediaType: "image/jpeg", preview: out };
  } catch {
    return fallback;
  }
}
