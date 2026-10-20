import { auth, storage } from './firebase';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

const compressImage = (file: File): Promise<string> => new Promise((resolve, reject) => {
  if (!file.type.startsWith('image/')) { reject(new Error('Choose an image file.')); return; }
  if (file.size > 12 * 1024 * 1024) { reject(new Error('Choose an image under 12 MB.')); return; }
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('This image could not be opened.'));
  reader.onload = () => {
    const image = new Image();
    image.onerror = () => reject(new Error('This image could not be opened.'));
    image.onload = () => {
      const scale = Math.min(1, 1080 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) { reject(new Error('Image editing is unavailable on this device.')); return; }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    image.src = String(reader.result || '');
  };
  reader.readAsDataURL(file);
});

export async function storeSocialPostImage(file: File): Promise<string> {
  const dataUrl = await compressImage(file);
  const user = auth.currentUser;
  if (!user) return dataUrl;
  const blob = await (await fetch(dataUrl)).blob();
  const id = 'post_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  const imageRef = ref(storage, `users/${user.uid}/social-posts/${id}.jpg`);
  await uploadBytes(imageRef, blob, { contentType: 'image/jpeg', customMetadata: { id, kind: 'social-post' } });
  return getDownloadURL(imageRef);
}
