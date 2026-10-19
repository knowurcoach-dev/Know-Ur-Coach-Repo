import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { siteMetadata, SEO_BRAND_KEYWORDS, APP_BASE_URL } from '@/lib/seo-config';
import robots from '@/app/robots';
import manifest from '@/app/manifest';

describe('Phase 80: Complete SEO Engine & Meta Tag Verification Tests', () => {
  describe('Root Layout Metadata & Keywords Matrix', () => {
    it('should configure domain as https://knowurcoach.in by default', () => {
      assert.equal(APP_BASE_URL, 'https://knowurcoach.in');
      const metadataBase = siteMetadata.metadataBase?.toString();
      assert.ok(metadataBase && metadataBase.includes('knowurcoach.in'));
    });

    it('should configure title template and pan-India brand title', () => {
      assert.ok(siteMetadata.title);
      if (typeof siteMetadata.title === 'object' && 'default' in siteMetadata.title) {
        assert.ok(siteMetadata.title.default.includes('KnowUrCoach'));
        assert.ok(siteMetadata.title.default.toLowerCase().includes('india'));
        assert.equal(siteMetadata.title.template, '%s | KnowUrCoach');
      } else {
        assert.fail('siteMetadata.title should be a Template object');
      }
    });

    it('should include exhaustive, rich keyword library across sports, martial arts, STEM, brain boosters, arts & cities', () => {
      const keywords = (siteMetadata.keywords || []) as string[];
      assert.ok(Array.isArray(keywords));
      assert.ok(keywords.length >= 80, `Keywords should have an exhaustive list, got ${keywords.length}`);

      const keywordsLower = keywords.map((k) => k.toLowerCase());
      // Brand
      assert.ok(keywordsLower.includes('knowurcoach'));
      assert.ok(keywordsLower.includes('knowurcoach.in'));
      assert.ok(keywordsLower.includes('find your coach'));
      assert.ok(keywordsLower.includes('find your coach india'));

      // Sports
      assert.ok(keywordsLower.some((k) => k.includes('cricket')));
      assert.ok(keywordsLower.some((k) => k.includes('badminton')));
      assert.ok(keywordsLower.some((k) => k.includes('swimming')));
      assert.ok(keywordsLower.some((k) => k.includes('football')));
      assert.ok(keywordsLower.some((k) => k.includes('tennis')));
      assert.ok(keywordsLower.some((k) => k.includes('skating')));
      assert.ok(keywordsLower.some((k) => k.includes('gymnastics')));

      // Martial Arts
      assert.ok(keywordsLower.some((k) => k.includes('karate')));
      assert.ok(keywordsLower.some((k) => k.includes('taekwondo')));
      assert.ok(keywordsLower.some((k) => k.includes('self defense')));

      // Brain Boosters & STEM
      assert.ok(keywordsLower.some((k) => k.includes('abacus')));
      assert.ok(keywordsLower.some((k) => k.includes('vedic maths')));
      assert.ok(keywordsLower.some((k) => k.includes('chess')));
      assert.ok(keywordsLower.some((k) => k.includes('robotics')));

      // Arts, Dance & Music
      assert.ok(keywordsLower.some((k) => k.includes('dance')));
      assert.ok(keywordsLower.some((k) => k.includes('guitar')));
      assert.ok(keywordsLower.some((k) => k.includes('drawing')));

      // Pan-India & Cities
      assert.ok(keywordsLower.some((k) => k.includes('india')));
      assert.ok(keywordsLower.some((k) => k.includes('delhi')));
      assert.ok(keywordsLower.some((k) => k.includes('mumbai')));
      assert.ok(keywordsLower.some((k) => k.includes('bangalore')));
      assert.ok(keywordsLower.some((k) => k.includes('agra')));
    });

    it('should configure multi-resolution favicon and touch icon tags', () => {
      assert.ok(siteMetadata.icons, 'Metadata must specify icons');
      const icons = siteMetadata.icons as any;
      assert.ok(icons.icon, 'Metadata must include icon array or path');
      assert.ok(icons.apple, 'Metadata must include apple-touch-icon');
      assert.equal(icons.shortcut, '/favicon.ico');
    });

    it('should configure OpenGraph and Twitter card metadata for social ranking', () => {
      assert.ok(siteMetadata.openGraph, 'OpenGraph metadata required');
      assert.equal(siteMetadata.openGraph.siteName, 'KnowUrCoach');
      assert.ok(siteMetadata.twitter, 'Twitter card metadata required');
      assert.equal((siteMetadata.twitter as any).card, 'summary_large_image');
    });

    it('should configure GoogleBot indexation and max preview directives', () => {
      assert.ok(siteMetadata.robots, 'Robots configuration required in metadata');
      const robotsMeta = siteMetadata.robots as any;
      assert.equal(robotsMeta.index, true);
      assert.equal(robotsMeta.follow, true);
      assert.equal(robotsMeta.googleBot?.index, true);
      assert.equal(robotsMeta.googleBot?.['max-image-preview'], 'large');
    });
  });

  describe('Robots.txt Engine (robots.ts)', () => {
    it('should allow public discovery routes and disallow private dashboard portals with knowurcoach.in sitemap', () => {
      const robotRules = robots();
      assert.ok(robotRules.rules);
      assert.ok(robotRules.sitemap?.includes('https://knowurcoach.in/sitemap.xml'));

      const rulesArray = Array.isArray(robotRules.rules) ? robotRules.rules : [robotRules.rules];
      const mainRule = rulesArray[0];

      assert.equal(mainRule.userAgent, '*');
      const disallows = Array.isArray(mainRule.disallow) ? mainRule.disallow : [mainRule.disallow];
      assert.ok(disallows.includes('/admin/'), 'Must protect /admin/ from crawling');
      assert.ok(disallows.includes('/coach/'), 'Must protect /coach/ from crawling');
      assert.ok(disallows.includes('/parent/'), 'Must protect /parent/ from crawling');
      assert.ok(disallows.includes('/api/'), 'Must protect /api/ from crawling');

      const allows = Array.isArray(mainRule.allow) ? mainRule.allow : [mainRule.allow];
      assert.ok(allows.includes('/'), 'Must allow homepage');
      assert.ok(allows.includes('/activities'), 'Must allow activities directory');
      assert.ok(allows.includes('/competitions'), 'Must allow competitions directory');
    });
  });

  describe('Web App Manifest (manifest.ts)', () => {
    it('should configure manifest name, theme color and multi-size icons for pan-India', () => {
      const pwaManifest = manifest();
      assert.ok(pwaManifest.name && pwaManifest.name.includes('KnowUrCoach'));
      assert.ok(pwaManifest.name && pwaManifest.name.includes('India'));
      assert.equal(pwaManifest.short_name, 'KnowUrCoach');
      assert.equal(pwaManifest.theme_color, '#059669');
      assert.ok(pwaManifest.icons && pwaManifest.icons.length >= 2);
    });
  });
});
