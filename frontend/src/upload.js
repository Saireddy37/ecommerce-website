import { api } from './api.js';

// Shrinks a big phone photo (often 4-8 MB) to at most 1200px, so it uploads fast on mobile data.
// If the browser can't read the file (for example some HEIC photos), the original is uploaded instead.
async function shrink(file, maxSize = 1200) {
  try {
    let bitmap;
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      bitmap = await createImageBitmap(file);
    }
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    return blob || file;
  } catch {
    return file;
  }
}

// Uploads one photo and returns its web address.
export async function uploadImage(file, token) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.');
  }

  const blob = await shrink(file);
  const sig = await api('/uploads/sign', { method: 'POST', token });

  const form = new FormData();
  form.append('file', blob, 'photo.jpg');
  form.append('api_key', sig.api_key);
  form.append('timestamp', sig.timestamp);
  form.append('folder', sig.folder);
  form.append('signature', sig.signature);

  let res;
  try {
    res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`, {
      method: 'POST',
      body: form,
    });
  } catch {
    throw new Error('Upload failed. Check your internet connection and try again.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error?.message || 'Upload failed');
  }

  // f_auto,q_auto,w_900 = Cloudinary serves a small, fast version of the photo to each visitor
  return data.secure_url.replace('/image/upload/', '/image/upload/f_auto,q_auto,w_900/');
}
