function cloudinaryTransform(url: string, transform: string): string {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url
  return url.replace('/upload/', `/upload/${transform}/`)
}

export function getCardImageUrl(url: string): string {
  return cloudinaryTransform(url, 'w_800,h_1000,c_fill,g_auto,f_auto,q_auto')
}

export function getThumbImageUrl(url: string): string {
  return cloudinaryTransform(url, 'w_400,h_400,c_fill,g_auto,f_auto,q_auto')
}

export function getDetailImageUrl(url: string): string {
  return cloudinaryTransform(url, 'w_1200,h_1500,c_fill,g_auto,f_auto,q_auto')
}
