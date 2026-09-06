import { describe, it, expect, beforeEach } from 'vitest';
import { xaiProvider } from '../ai/xaiProvider';
import { createDefaultRouter } from '../ai/providerRouter';
import { useTerminalStore } from '../../stores/useTerminalStore';

describe('AI Provider Custom Models', () => {
  beforeEach(() => {
    useTerminalStore.setState({
      activeProvider: 'xai',
      activeModel: 'grok-2-latest',
      providerCustomModels: {
        xai: 'grok-2-latest',
      },
    });
  });

  describe('xaiProvider', () => {
    it('should have grok-2-latest as the default model instead of grok-beta', () => {
      const defaultModel = xaiProvider.getDefaultModel();
      expect(defaultModel.id).toBe('grok-2-latest');
      expect(defaultModel.name).toContain('Grok 2');
    });

    it('should allow adding custom models and make it the default model', () => {
      xaiProvider.addCustomModel('grok-3-preview', 'Grok 3 Preview');
      const model = xaiProvider.getModel('grok-3-preview');
      expect(model).toBeDefined();
      expect(model?.id).toBe('grok-3-preview');
      expect(xaiProvider.getDefaultModel().id).toBe('grok-3-preview');
    });
  });

  describe('AIProviderRouter custom models', () => {
    it('should store and reflect custom models in getProviderModels', () => {
      const router = createDefaultRouter();
      router.addProviderCustomModel('xai', 'grok-custom-special');

      const models = router.getProviderModels('xai');
      expect(models.some((m) => m.id === 'grok-custom-special')).toBe(true);
      expect(router.getProviderCustomModel('xai')).toBe('grok-custom-special');
    });

    it('should apply custom model when loading provider', async () => {
      const router = createDefaultRouter();
      router.addProviderCustomModel('xai', 'grok-future-model');

      const provider = await router.getProvider('xai');
      expect(provider).toBeDefined();
      expect(provider?.getDefaultModel().id).toBe('grok-future-model');
    });
  });

  describe('useTerminalStore providerCustomModels', () => {
    it('should update providerCustomModels and sync activeModel when activeProvider matches', () => {
      const store = useTerminalStore.getState();
      expect(store.activeProvider).toBe('xai');

      store.setProviderCustomModel('xai', 'grok-2-vision-1212');

      const updated = useTerminalStore.getState();
      expect(updated.providerCustomModels['xai']).toBe('grok-2-vision-1212');
      expect(updated.activeModel).toBe('grok-2-vision-1212');
    });

    it('should update providerCustomModels without altering activeModel if different provider', () => {
      const store = useTerminalStore.getState();
      expect(store.activeProvider).toBe('xai');

      store.setProviderCustomModel('deepseek', 'deepseek-reasoner');

      const updated = useTerminalStore.getState();
      expect(updated.providerCustomModels['deepseek']).toBe('deepseek-reasoner');
      expect(updated.activeProvider).toBe('xai');
      expect(updated.activeModel).not.toBe('deepseek-reasoner');
    });
  });
});
