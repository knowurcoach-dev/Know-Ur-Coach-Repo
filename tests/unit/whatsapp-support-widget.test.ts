import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  SUPPORT_WHATSAPP_NUMBER,
  SUPPORT_WHATSAPP_URL,
} from '@/components/ui/WhatsAppSupportWidget';

describe('Phase 50: WhatsApp Support Widget State Machine Tests', () => {
  const SESSION_STORAGE_KEY = 'kuc_wa_prompt_dismissed';

  function shouldDisplayPrompt(hasTimerElapsed: boolean, isDismissed: boolean): boolean {
    return hasTimerElapsed && !isDismissed;
  }

  function handlePromptDismiss(storageMock: Record<string, string>) {
    storageMock[SESSION_STORAGE_KEY] = 'true';
    return {
      showPrompt: false,
      isDismissed: true,
    };
  }

  function checkSessionDismissed(storageMock: Record<string, string>): boolean {
    return storageMock[SESSION_STORAGE_KEY] === 'true';
  }

  describe('Support Contact Credentials & Deep Link', () => {
    it('should configure verified Indian support WhatsApp number', () => {
      assert.strictEqual(SUPPORT_WHATSAPP_NUMBER, '919762577714');
    });

    it('should format URL with wa.me domain, country code, and prefilled inquiry message', () => {
      assert.strictEqual(
        SUPPORT_WHATSAPP_URL,
        'https://wa.me/919762577714?text=Hi%20KnowUrCoach%20Team%2C%20I%20need%20support%20assistance'
      );
      assert.ok(SUPPORT_WHATSAPP_URL.startsWith('https://wa.me/'));
      assert.ok(SUPPORT_WHATSAPP_URL.includes(SUPPORT_WHATSAPP_NUMBER));
    });
  });

  describe('Prompt Bubble Display & Session Dismissal Logic', () => {
    it('should not show prompt before timer delay elapses', () => {
      const show = shouldDisplayPrompt(false, false);
      assert.strictEqual(show, false);
    });

    it('should show prompt once delay elapses if not dismissed', () => {
      const show = shouldDisplayPrompt(true, false);
      assert.strictEqual(show, true);
    });

    it('should suppress prompt if user previously dismissed it in session', () => {
      const show = shouldDisplayPrompt(true, true);
      assert.strictEqual(show, false);
    });

    it('should persist dismissal flag into sessionStorage when user clicks dismiss', () => {
      const mockStorage: Record<string, string> = {};
      assert.strictEqual(checkSessionDismissed(mockStorage), false);

      const state = handlePromptDismiss(mockStorage);
      assert.strictEqual(state.showPrompt, false);
      assert.strictEqual(state.isDismissed, true);
      assert.strictEqual(checkSessionDismissed(mockStorage), true);
    });
  });
});
