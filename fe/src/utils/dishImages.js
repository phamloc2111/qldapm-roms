import catalog from '../data/menuImages.json';

export const DEFAULT_DISH_IMAGE = '/images/menu/no-image.svg';

const normalizeName = (name = '') => name.normalize('NFC').trim().toLocaleLowerCase('vi');
const imagesByName = new Map(catalog.map((item) => [normalizeName(item.name), item.imageUrl]));

export function resolveDishImage(name, imageUrl) {
  const url = imageUrl?.trim();
  const isLegacyPlaceholder = url?.includes('images.unsplash.com/photo-1546069901-ba9599a7e63c');
  const isLegacyLocalImage = url?.startsWith('/images/menu/') && url.endsWith('.webp');
  if (url && !isLegacyPlaceholder && !isLegacyLocalImage && url !== DEFAULT_DISH_IMAGE) return url;
  return imagesByName.get(normalizeName(name)) || DEFAULT_DISH_IMAGE;
}

export function handleDishImageError(event) {
  const image = event.currentTarget;
  // Stop after one fallback, including when the fallback itself cannot load.
  if (image.getAttribute('src') !== DEFAULT_DISH_IMAGE) image.src = DEFAULT_DISH_IMAGE;
}
