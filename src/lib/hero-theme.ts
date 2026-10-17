export interface HeroCarouselTheme {
  // Overlay Controls
  overlayColor: string; // Hex color (e.g. '#020617')
  overlayOpacity: number; // 0 to 100 (default: 65)
  overlayGradientType: 'balanced-scrim' | 'cinematic-fade' | 'subtle-tint' | 'radial-vignette';

  // Title Typography Controls
  titleColor: string; // Hex color (e.g. '#ffffff')
  titleFontSizeMobile: 'sm' | 'base' | 'lg' | 'xl' | '2xl'; // default: 'lg'
  titleFontSizeDesktop: '2xl' | '3xl' | '4xl' | '5xl' | '6xl'; // default: '5xl'
  titleFontWeight: 'bold' | 'extrabold' | 'black'; // default: 'black'
  titleDropShadow: 'none' | 'subtle' | 'medium' | 'strong'; // default: 'medium'

  // Subtitle Typography Controls
  subtitleColor: string; // Hex color (e.g. '#e2e8f0')
  subtitleFontSizeMobile: 'xs' | 'sm'; // default: 'xs'
  subtitleFontSizeDesktop: 'xs' | 'sm' | 'base'; // default: 'sm'
  subtitleFontWeight: 'normal' | 'medium' | 'semibold'; // default: 'medium'

  // Imagery & Visual Effects
  imageBrightness: number; // 75 to 115 (default: 100)
  cardHeightMobile: 'compact' | 'standard' | 'tall'; // default: 'standard' (290px)
  cardHeightDesktop: 'compact' | 'standard' | 'tall'; // default: 'standard' (390px)
  borderRadius: 'rounded-2xl' | 'rounded-3xl' | 'rounded-4xl'; // default: 'rounded-3xl'

  // Badge Pill Styling
  badgeBgColor: string; // Hex (e.g. '#000000')
  badgeBgOpacity: number; // 0 to 100 (default: 50)
  badgeTextColor: string; // Hex (e.g. '#ffffff')
  badgeAccentColor: string; // Hex (e.g. '#34d399')
}

export const DEFAULT_HERO_CAROUSEL_THEME: HeroCarouselTheme = {
  overlayColor: '#020617',
  overlayOpacity: 65,
  overlayGradientType: 'balanced-scrim',

  titleColor: '#ffffff',
  titleFontSizeMobile: 'lg',
  titleFontSizeDesktop: '5xl',
  titleFontWeight: 'black',
  titleDropShadow: 'medium',

  subtitleColor: '#e2e8f0',
  subtitleFontSizeMobile: 'xs',
  subtitleFontSizeDesktop: 'sm',
  subtitleFontWeight: 'medium',

  imageBrightness: 100,
  cardHeightMobile: 'standard',
  cardHeightDesktop: 'standard',
  borderRadius: 'rounded-3xl',

  badgeBgColor: '#000000',
  badgeBgOpacity: 50,
  badgeTextColor: '#ffffff',
  badgeAccentColor: '#34d399',
};

/**
 * Convert hex color (#RRGGBB or #RGB) to rgba string with alpha (0 to 1)
 */
export function hexToRgba(hex: string, alpha: number): string {
  if (!hex || typeof hex !== 'string') return `rgba(2, 6, 23, ${alpha})`;
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  if (cleanHex.length !== 6) return `rgba(2, 6, 23, ${alpha})`;
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

/**
 * Generate CSS gradient string for the hero overlay
 */
export function getHeroOverlayGradient(theme: HeroCarouselTheme, isDesktop: boolean = true): string {
  const baseAlpha = (theme.overlayOpacity ?? 65) / 100;
  const color = theme.overlayColor || '#020617';

  switch (theme.overlayGradientType) {
    case 'cinematic-fade':
      return isDesktop
        ? `linear-gradient(105deg, ${hexToRgba(color, baseAlpha)} 0%, ${hexToRgba(color, baseAlpha * 0.55)} 45%, ${hexToRgba(color, 0)} 85%)`
        : `linear-gradient(to top, ${hexToRgba(color, baseAlpha)} 0%, ${hexToRgba(color, baseAlpha * 0.4)} 50%, ${hexToRgba(color, 0)} 100%)`;

    case 'subtle-tint':
      return `linear-gradient(to top, ${hexToRgba(color, baseAlpha * 0.75)} 0%, ${hexToRgba(color, baseAlpha * 0.3)} 100%)`;

    case 'radial-vignette':
      return isDesktop
        ? `radial-gradient(circle at 25% 50%, ${hexToRgba(color, baseAlpha)} 0%, ${hexToRgba(color, baseAlpha * 0.4)} 55%, ${hexToRgba(color, 0)} 100%)`
        : `radial-gradient(circle at 50% 85%, ${hexToRgba(color, baseAlpha)} 0%, ${hexToRgba(color, baseAlpha * 0.4)} 60%, ${hexToRgba(color, 0)} 100%)`;

    case 'balanced-scrim':
    default:
      return isDesktop
        ? `linear-gradient(to right, ${hexToRgba(color, baseAlpha)} 0%, ${hexToRgba(color, baseAlpha * 0.45)} 55%, ${hexToRgba(color, 0)} 100%)`
        : `linear-gradient(to top, ${hexToRgba(color, baseAlpha)} 0%, ${hexToRgba(color, baseAlpha * 0.35)} 60%, ${hexToRgba(color, 0)} 100%)`;
  }
}

/**
 * Get Card Height classes based on theme settings
 */
export function getHeroCardHeightClass(theme: HeroCarouselTheme): string {
  const mobileMap = {
    compact: 'h-[260px]',
    standard: 'h-[290px]',
    tall: 'h-[340px]',
  };
  const desktopMap = {
    compact: 'md:h-[340px]',
    standard: 'md:h-[390px]',
    tall: 'md:h-[450px]',
  };
  const smMap = {
    compact: 'sm:h-[310px]',
    standard: 'sm:h-[350px]',
    tall: 'sm:h-[400px]',
  };

  const m = mobileMap[theme.cardHeightMobile] || mobileMap.standard;
  const s = smMap[theme.cardHeightMobile] || smMap.standard;
  const d = desktopMap[theme.cardHeightDesktop] || desktopMap.standard;
  return `${m} ${s} ${d}`;
}
