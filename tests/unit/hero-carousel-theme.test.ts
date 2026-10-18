import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  DEFAULT_HERO_SLIDES,
  HeroSlideData,
} from '@/lib/hero-slides';
import {
  DEFAULT_HERO_CAROUSEL_THEME,
  HeroCarouselTheme,
  hexToRgba,
  getHeroOverlayGradient,
  getHeroCardHeightClass,
} from '@/lib/hero-theme';

describe('Phase 15: Hero Carousel Slides & Visual Theme Engine Tests', () => {
  describe('DEFAULT_HERO_SLIDES Configuration Structure', () => {
    it('should define exactly 4 default slides covering the core platform verticals', () => {
      assert.strictEqual(DEFAULT_HERO_SLIDES.length, 4);

      const slideIds = DEFAULT_HERO_SLIDES.map((s) => s.id);
      assert.deepStrictEqual(slideIds, [
        'slide-sports',
        'slide-stem',
        'slide-arts',
        'slide-racquet',
      ]);
    });

    it('should have sequential ordering and active status by default', () => {
      DEFAULT_HERO_SLIDES.forEach((slide, idx) => {
        assert.strictEqual(slide.order, idx + 1);
        assert.strictEqual(slide.isActive, true);
        assert.ok(slide.imageUrl.startsWith('https://images.unsplash.com'));
        assert.ok(slide.title.length > 10);
        assert.ok(slide.ctaLink);
        assert.strictEqual(slide.showTitle, true);
        assert.strictEqual(slide.showPrimaryCta, true);
      });
    });
  });

  describe('hexToRgba() Color Converter', () => {
    it('should convert standard 6-digit hex color to rgba string', () => {
      const rgba = hexToRgba('#020617', 0.65);
      assert.strictEqual(rgba, 'rgba(2, 6, 23, 0.65)');
    });

    it('should convert shorthand 3-digit hex color to rgba string', () => {
      const rgba = hexToRgba('#fff', 0.8);
      assert.strictEqual(rgba, 'rgba(255, 255, 255, 0.8)');
    });

    it('should clamp alpha values between 0 and 1', () => {
      assert.strictEqual(hexToRgba('#000000', -0.5), 'rgba(0, 0, 0, 0)');
      assert.strictEqual(hexToRgba('#000000', 1.5), 'rgba(0, 0, 0, 1)');
    });

    it('should gracefully fallback for invalid hex string', () => {
      const fallback = hexToRgba('invalid_color', 0.5);
      assert.strictEqual(fallback, 'rgba(2, 6, 23, 0.5)');
    });
  });

  describe('getHeroOverlayGradient() CSS Gradient Generator', () => {
    const theme: HeroCarouselTheme = {
      ...DEFAULT_HERO_CAROUSEL_THEME,
      overlayColor: '#000000',
      overlayOpacity: 70,
    };

    it('should generate balanced-scrim gradient for desktop (to right) and mobile (to top)', () => {
      const desktop = getHeroOverlayGradient(
        { ...theme, overlayGradientType: 'balanced-scrim' },
        true
      );
      assert.ok(desktop.startsWith('linear-gradient(to right,'));

      const mobile = getHeroOverlayGradient(
        { ...theme, overlayGradientType: 'balanced-scrim' },
        false
      );
      assert.ok(mobile.startsWith('linear-gradient(to top,'));
    });

    it('should generate cinematic-fade gradient with 105deg angle on desktop', () => {
      const desktop = getHeroOverlayGradient(
        { ...theme, overlayGradientType: 'cinematic-fade' },
        true
      );
      assert.ok(desktop.startsWith('linear-gradient(105deg,'));
    });

    it('should generate subtle-tint gradient to top', () => {
      const gradient = getHeroOverlayGradient(
        { ...theme, overlayGradientType: 'subtle-tint' },
        true
      );
      assert.ok(gradient.startsWith('linear-gradient(to top,'));
    });

    it('should generate radial-vignette gradient', () => {
      const desktop = getHeroOverlayGradient(
        { ...theme, overlayGradientType: 'radial-vignette' },
        true
      );
      assert.ok(desktop.startsWith('radial-gradient(circle at 25% 50%,'));

      const mobile = getHeroOverlayGradient(
        { ...theme, overlayGradientType: 'radial-vignette' },
        false
      );
      assert.ok(mobile.startsWith('radial-gradient(circle at 50% 85%,'));
    });
  });

  describe('getHeroCardHeightClass() Responsive Sizing', () => {
    it('should map standard height configuration to standard Tailwind classes', () => {
      const height = getHeroCardHeightClass(DEFAULT_HERO_CAROUSEL_THEME);
      assert.strictEqual(height, 'h-[290px] sm:h-[350px] md:h-[390px]');
    });

    it('should map compact height configuration', () => {
      const height = getHeroCardHeightClass({
        ...DEFAULT_HERO_CAROUSEL_THEME,
        cardHeightMobile: 'compact',
        cardHeightDesktop: 'compact',
      });
      assert.strictEqual(height, 'h-[260px] sm:h-[310px] md:h-[340px]');
    });

    it('should map tall height configuration', () => {
      const height = getHeroCardHeightClass({
        ...DEFAULT_HERO_CAROUSEL_THEME,
        cardHeightMobile: 'tall',
        cardHeightDesktop: 'tall',
      });
      assert.strictEqual(height, 'h-[340px] sm:h-[400px] md:h-[450px]');
    });
  });
});
