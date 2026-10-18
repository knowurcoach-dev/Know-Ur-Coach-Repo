import { describe, it } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { BrandLogo } from '../../src/components/brand/BrandLogo';
import { KpiCounterGrid, KpiMetric } from '../../src/components/dashboard/KpiCounterGrid';
import {
  CoachDashboardSkeleton,
  ParentBookingsSkeleton,
  AdminDashboardSkeleton,
  AdminVerifySkeleton,
  CoachPlansSkeleton,
  GeneralCoachPageSkeleton,
  ActivityCardSkeleton,
  ActivityDetailSkeleton,
  AdminTableSkeleton,
} from '../../src/components/dashboard/DashboardSkeleton';

describe('Phase 58: Brand Logo and Dashboard Primitives Matrix', () => {
  describe('BrandLogo Component', () => {
    it('should render clickable logo linking to root by default', () => {
      const element = BrandLogo({ size: 'md', variant: 'light', clickable: true });
      assert.strictEqual(typeof element, 'object');
      assert.ok(element !== null);
      // Link element (Next.js Link forwardRef component)
      assert.ok(element.type && (typeof element.type === 'object' || typeof element.type === 'function'));
      assert.strictEqual(element.props.href, '/');
      assert.ok(element.props.className.includes('inline-flex'));
    });

    it('should render non-clickable div when clickable is false', () => {
      const element = BrandLogo({ size: 'lg', clickable: false, className: 'custom-logo-class' });
      assert.strictEqual(element.type, 'div');
      assert.ok(element.props.className.includes('custom-logo-class'));
      assert.ok(element.props.className.includes('inline-flex'));
    });

    it('should select appropriate logoSrc based on iconOnly and variant dark', () => {
      // 1. iconOnly => logo-icon.png
      const iconOnlyEl = BrandLogo({ iconOnly: true, clickable: false });
      const img1 = iconOnlyEl.props.children.props.children;
      assert.strictEqual(img1.props.src, '/images/brand/logo-icon.png');
      assert.strictEqual(img1.props.width, 80);
      assert.strictEqual(img1.props.height, 80);

      // 2. dark variant => logo-dark-mode.png
      const darkEl = BrandLogo({ variant: 'dark', clickable: false });
      const img2 = darkEl.props.children.props.children;
      assert.strictEqual(img2.props.src, '/images/brand/logo-dark-mode.png');
      assert.strictEqual(img2.props.width, 383);
      assert.strictEqual(img2.props.height, 100);

      // 3. light variant (default) => logo-full.png
      const lightEl = BrandLogo({ variant: 'light', clickable: false });
      const img3 = lightEl.props.children.props.children;
      assert.strictEqual(img3.props.src, '/images/brand/logo-full.png');
    });

    it('should apply accurate size height classes across sm, md, lg, xl', () => {
      const sizes: Array<'sm' | 'md' | 'lg' | 'xl'> = ['sm', 'md', 'lg', 'xl'];
      for (const size of sizes) {
        const fullEl = BrandLogo({ size, clickable: false });
        const imgFull = fullEl.props.children.props.children;
        assert.ok(imgFull.props.className.includes('w-auto'));

        const iconEl = BrandLogo({ size, iconOnly: true, clickable: false });
        const imgIcon = iconEl.props.children.props.children;
        if (size === 'sm') {
          assert.ok(imgIcon.props.className.includes('h-8 w-8'));
        } else if (size === 'xl') {
          assert.ok(imgIcon.props.className.includes('h-20 w-20'));
        }
      }
    });
  });

  describe('KpiCounterGrid Component', () => {
    it('should render default KPI items when no metrics prop is passed', () => {
      const element = KpiCounterGrid({});
      assert.ok(element.props.className.includes('grid grid-cols-4'));
      const children = element.props.children;
      assert.strictEqual(children.length, 4);

      // Check default metrics labels
      const labels = children.map((c: any) => c.props.children[1].props.children);
      assert.deepStrictEqual(labels, ['Students', 'New Leads', 'Revenue', '38 Reviews']);

      // Check default values
      const values = children.map((c: any) => c.props.children[0].props.children);
      assert.deepStrictEqual(values, ['14', '12', '₹34.2K', '4.9★']);
    });

    it('should render custom KPI metrics with designated color tokens', () => {
      const customMetrics: KpiMetric[] = [
        { label: 'Active Roster', value: '88', valueColor: 'text-emerald-400' },
        { label: 'Pending KYC', value: '3', valueColor: 'text-amber-400' },
      ];
      const element = KpiCounterGrid({ metrics: customMetrics });
      const children = element.props.children;
      assert.strictEqual(children.length, 2);

      assert.strictEqual(children[0].props.children[0].props.children, '88');
      assert.ok(children[0].props.children[0].props.className.includes('text-emerald-400'));
      assert.strictEqual(children[0].props.children[1].props.children, 'Active Roster');

      assert.strictEqual(children[1].props.children[0].props.children, '3');
      assert.ok(children[1].props.children[0].props.className.includes('text-amber-400'));
    });
  });

  describe('Dashboard Skeletons Matrix', () => {
    it('should render CoachDashboardSkeleton with pulsating animation', () => {
      const el = CoachDashboardSkeleton();
      assert.ok(el.props.className.includes('animate-pulse'));
      assert.ok(el.props.className.includes('bg-slate-50'));
    });

    it('should render ParentBookingsSkeleton with filter pills and pass grid placeholders', () => {
      const el = ParentBookingsSkeleton();
      assert.ok(el.props.className.includes('animate-pulse'));
      const mainContainer = el.props.children;
      assert.ok(mainContainer.props.className.includes('max-w-7xl'));
    });

    it('should render AdminDashboardSkeleton and AdminVerifySkeleton', () => {
      const adminDash = AdminDashboardSkeleton();
      assert.ok(adminDash.props.className.includes('animate-pulse'));

      const adminVerify = AdminVerifySkeleton();
      assert.ok(adminVerify.props.className.includes('animate-pulse'));
    });

    it('should render CoachPlansSkeleton and GeneralCoachPageSkeleton with optional title', () => {
      const plans = CoachPlansSkeleton();
      assert.ok(plans.props.className.includes('animate-pulse'));

      const general = GeneralCoachPageSkeleton({ title: 'Batch Timings' });
      assert.ok(general.props.className.includes('animate-pulse'));
    });

    it('should render ActivityCardSkeleton with dynamic count and ActivityDetailSkeleton', () => {
      const cardsDefault = ActivityCardSkeleton({});
      assert.strictEqual(cardsDefault.props.children.length, 4);

      const cardsCustom = ActivityCardSkeleton({ count: 6 });
      assert.strictEqual(cardsCustom.props.children.length, 6);

      const detail = ActivityDetailSkeleton();
      assert.ok(detail.props.className.includes('animate-pulse'));

      const adminTable = AdminTableSkeleton({ title: 'KYC Submissions' });
      assert.ok(adminTable.props.className.includes('animate-pulse'));
    });
  });
});
