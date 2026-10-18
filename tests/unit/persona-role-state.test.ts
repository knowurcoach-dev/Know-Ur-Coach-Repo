import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Phase 32: Persona Context & Location Management State Machine Tests', () => {
  type PersonaType = 'parent' | 'coach' | 'admin' | 'guest';

  class PersonaStateManager {
    activePersona: PersonaType = 'guest';
    activeCity: string = 'Agra';
    activeLocality: string = 'All Localities';
    activeCentreId: string | null = null;
    toastQueue: string[] = [];

    switchPersona(persona: PersonaType, centreId?: string) {
      this.activePersona = persona;
      if (persona === 'coach') {
        this.activeCentreId = centreId || 'centre-coach-default';
        this.toastQueue.push('Switched to Coach Persona (Academy Dashboard View)');
      } else if (persona === 'admin') {
        this.activeCentreId = null;
        this.toastQueue.push('Switched to Platform Administrator Mode');
      } else if (persona === 'parent') {
        this.activeCentreId = null;
        this.toastQueue.push('Switched to Parent Persona (Family Bookings View)');
      } else {
        this.activeCentreId = null;
      }
    }

    setLocation(city: string, locality: string = 'All Localities') {
      const cleanCity = city?.trim() || 'Agra';
      this.activeCity = cleanCity;
      this.activeLocality = locality?.trim() || 'All Localities';
      this.toastQueue.push(`📍 Location set to ${this.activeLocality}, ${this.activeCity}`);
    }
  }

  describe('Location & City Selection State Machine', () => {
    it('should initialize with default city as Agra and All Localities', () => {
      const manager = new PersonaStateManager();

      assert.strictEqual(manager.activeCity, 'Agra');
      assert.strictEqual(manager.activeLocality, 'All Localities');
    });

    it('should update location and emit toast confirmation', () => {
      const manager = new PersonaStateManager();

      manager.setLocation('Delhi NCR', 'Vasant Kunj');

      assert.strictEqual(manager.activeCity, 'Delhi NCR');
      assert.strictEqual(manager.activeLocality, 'Vasant Kunj');
      assert.ok(manager.toastQueue.includes('📍 Location set to Vasant Kunj, Delhi NCR'));
    });

    it('should fallback to Agra when setting empty or null city', () => {
      const manager = new PersonaStateManager();

      manager.setLocation('');
      assert.strictEqual(manager.activeCity, 'Agra');
    });
  });

  describe('Persona Switching & Center Association', () => {
    it('should configure coach persona with isolated academy centre ID', () => {
      const manager = new PersonaStateManager();

      manager.switchPersona('coach', 'ctr-agra-badminton-01');

      assert.strictEqual(manager.activePersona, 'coach');
      assert.strictEqual(manager.activeCentreId, 'ctr-agra-badminton-01');
      assert.ok(manager.toastQueue.includes('Switched to Coach Persona (Academy Dashboard View)'));
    });

    it('should clear activeCentreId when switching to parent or admin persona', () => {
      const manager = new PersonaStateManager();

      // First coach
      manager.switchPersona('coach', 'ctr-test');
      assert.strictEqual(manager.activeCentreId, 'ctr-test');

      // Then parent
      manager.switchPersona('parent');
      assert.strictEqual(manager.activePersona, 'parent');
      assert.strictEqual(manager.activeCentreId, null);

      // Then admin
      manager.switchPersona('admin');
      assert.strictEqual(manager.activePersona, 'admin');
      assert.strictEqual(manager.activeCentreId, null);
    });
  });
});
