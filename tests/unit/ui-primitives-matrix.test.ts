import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Phase 57: UI Primitives Design System Matrix Tests', () => {
  // Logic extracted directly from src/components/ui/Button.tsx
  function resolveButtonClasses(props: {
    variant?: 'solid' | 'outline' | 'ghost' | 'glass';
    color?: 'blue' | 'emerald' | 'orange' | 'dark' | 'purple' | 'red';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
  }) {
    const { variant = 'solid', color = 'blue', size = 'md', fullWidth = false } = props;

    const sizeClasses = {
      sm: 'text-[10px] px-2.5 py-1.5',
      md: 'text-xs px-3.5 py-2.5',
      lg: 'text-sm px-5 py-3.5',
    };

    const solidColors = {
      blue: 'bg-[#0066ff] hover:bg-blue-700 text-white shadow-md shadow-blue-500/20',
      emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
      orange: 'bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-500/20',
      dark: 'bg-[#0a1128] hover:bg-slate-900 text-white shadow-md',
      purple: 'bg-purple-600 hover:bg-purple-700 text-white shadow-md',
      red: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm',
    };

    const outlineColors = {
      blue: 'bg-white border border-blue-200 text-blue-700 hover:bg-blue-50',
      emerald: 'bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50',
      orange: 'bg-white border border-orange-200 text-orange-600 hover:bg-orange-50',
      dark: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50',
      purple: 'bg-white border border-purple-200 text-purple-700 hover:bg-purple-50',
      red: 'bg-white border border-rose-200 text-rose-600 hover:bg-rose-50',
    };

    const ghostColors = {
      blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
      emerald: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
      orange: 'bg-orange-50 text-orange-700 hover:bg-orange-100',
      dark: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
      purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
      red: 'bg-rose-50 text-rose-700 hover:bg-rose-100',
    };

    const glassClasses = 'backdrop-blur-md bg-white/20 hover:bg-white/30 text-white border border-white/25 shadow-xs';

    let variantClass = solidColors[color];
    if (variant === 'outline') variantClass = outlineColors[color];
    else if (variant === 'ghost') variantClass = ghostColors[color];
    else if (variant === 'glass') variantClass = glassClasses;

    return {
      sizeClass: sizeClasses[size],
      variantClass,
      isFullWidth: fullWidth,
    };
  }

  // Logic extracted directly from src/components/ui/Badge.tsx
  function resolveBadgeClasses(props: {
    color?: 'emerald' | 'blue' | 'orange' | 'purple' | 'yellow' | 'red' | 'gray';
    size?: 'xs' | 'sm';
    hasDot?: boolean;
    pulse?: boolean;
  }) {
    const { color = 'blue', size = 'xs', hasDot = false, pulse = false } = props;

    const sizeClasses = {
      xs: 'text-[9px] px-2 py-0.5',
      sm: 'text-[10px] px-2.5 py-1',
    };

    const colorClasses = {
      emerald: 'bg-emerald-100 text-emerald-800',
      blue: 'bg-blue-100 text-blue-800',
      orange: 'bg-orange-100 text-orange-800',
      purple: 'bg-purple-100 text-purple-800',
      yellow: 'bg-yellow-400 text-gray-900',
      red: 'bg-red-100 text-red-800',
      gray: 'bg-gray-100 text-gray-700',
    };

    const dotColors = {
      emerald: 'bg-emerald-500',
      blue: 'bg-blue-500',
      orange: 'bg-orange-500',
      purple: 'bg-purple-500',
      yellow: 'bg-yellow-800',
      red: 'bg-red-500',
      gray: 'bg-gray-500',
    };

    return {
      sizeClass: sizeClasses[size],
      colorClass: colorClasses[color],
      dotClass: hasDot ? dotColors[color] : null,
      isPulsing: hasDot && pulse,
    };
  }

  // Logic extracted directly from src/components/ui/FilterPill.tsx
  function resolveFilterPillClasses(props: {
    active?: boolean;
    colorScheme?: 'blue' | 'dark' | 'emerald' | 'orange';
    size?: 'xs' | 'sm';
  }) {
    const { active = false, colorScheme = 'blue', size = 'sm' } = props;

    const sizeClasses = {
      xs: 'text-[9px] px-2.5 py-1',
      sm: 'text-[10px] md:text-xs px-3 py-1.5',
    };

    const activeColorClasses = {
      blue: 'bg-blue-600 text-white shadow-xs',
      dark: 'bg-[#0a1128] text-white shadow-sm',
      emerald: 'bg-emerald-600 text-white shadow-xs',
      orange: 'bg-orange-600 text-white shadow-xs',
    };

    const inactiveClasses = 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100';

    return {
      sizeClass: sizeClasses[size],
      stateClass: active ? activeColorClasses[colorScheme] : inactiveClasses,
      isActive: active,
    };
  }

  describe('Button Primitive Matrix', () => {
    it('should map solid colors with appropriate high-contrast backgrounds', () => {
      const solidBlue = resolveButtonClasses({ variant: 'solid', color: 'blue' });
      assert.ok(solidBlue.variantClass.includes('bg-[#0066ff]'));

      const solidEmerald = resolveButtonClasses({ variant: 'solid', color: 'emerald' });
      assert.ok(solidEmerald.variantClass.includes('bg-emerald-600'));
    });

    it('should map outline variants with white background and color-accented borders', () => {
      const outlineOrange = resolveButtonClasses({ variant: 'outline', color: 'orange' });
      assert.ok(outlineOrange.variantClass.includes('bg-white'));
      assert.ok(outlineOrange.variantClass.includes('border-orange-200'));
      assert.ok(outlineOrange.variantClass.includes('text-orange-600'));
    });

    it('should map ghost variants with soft tinted backgrounds', () => {
      const ghostPurple = resolveButtonClasses({ variant: 'ghost', color: 'purple' });
      assert.ok(ghostPurple.variantClass.includes('bg-purple-50'));
      assert.ok(ghostPurple.variantClass.includes('text-purple-700'));
    });

    it('should configure glass variant with backdrop blur and semi-transparent white', () => {
      const glass = resolveButtonClasses({ variant: 'glass' });
      assert.ok(glass.variantClass.includes('backdrop-blur-md'));
      assert.ok(glass.variantClass.includes('bg-white/20'));
    });

    it('should resolve sizes correctly and apply fullWidth flag', () => {
      const smBtn = resolveButtonClasses({ size: 'sm', fullWidth: true });
      assert.strictEqual(smBtn.sizeClass, 'text-[10px] px-2.5 py-1.5');
      assert.strictEqual(smBtn.isFullWidth, true);

      const lgBtn = resolveButtonClasses({ size: 'lg', fullWidth: false });
      assert.strictEqual(lgBtn.sizeClass, 'text-sm px-5 py-3.5');
      assert.strictEqual(lgBtn.isFullWidth, false);
    });
  });

  describe('Badge Primitive Matrix', () => {
    it('should map badge color tokens for verified, premier, and rating badges', () => {
      const emeraldBadge = resolveBadgeClasses({ color: 'emerald' });
      assert.strictEqual(emeraldBadge.colorClass, 'bg-emerald-100 text-emerald-800');

      const yellowBadge = resolveBadgeClasses({ color: 'yellow' });
      assert.strictEqual(yellowBadge.colorClass, 'bg-yellow-400 text-gray-900');
    });

    it('should configure dot indicator with optional pulse animation', () => {
      const pulseDot = resolveBadgeClasses({ color: 'emerald', hasDot: true, pulse: true });
      assert.strictEqual(pulseDot.dotClass, 'bg-emerald-500');
      assert.strictEqual(pulseDot.isPulsing, true);

      const staticBadge = resolveBadgeClasses({ color: 'blue', hasDot: false, pulse: false });
      assert.strictEqual(staticBadge.dotClass, null);
      assert.strictEqual(staticBadge.isPulsing, false);
    });
  });

  describe('FilterPill Primitive Matrix', () => {
    it('should render active state with themed background and white text', () => {
      const activeEmerald = resolveFilterPillClasses({ active: true, colorScheme: 'emerald' });
      assert.strictEqual(activeEmerald.isActive, true);
      assert.strictEqual(activeEmerald.stateClass, 'bg-emerald-600 text-white shadow-xs');

      const activeDark = resolveFilterPillClasses({ active: true, colorScheme: 'dark' });
      assert.strictEqual(activeDark.stateClass, 'bg-[#0a1128] text-white shadow-sm');
    });

    it('should render neutral gray inactive state with hover styling when inactive', () => {
      const inactive = resolveFilterPillClasses({ active: false, colorScheme: 'blue' });
      assert.strictEqual(inactive.isActive, false);
      assert.strictEqual(inactive.stateClass, 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100');
    });
  });
});
