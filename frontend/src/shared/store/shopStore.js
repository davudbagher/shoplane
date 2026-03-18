import { create } from 'zustand';
import { adminApi } from '../api';

export const useShopStore = create((set, get) => ({
  shops: [],
  activeShopId: null,
  isLoading: false,
  error: null,

  // Fetch shops and auto-select the first one if none is active
  fetchShops: async () => {
    set({ isLoading: true, error: null });
    try {
      const shopsData = await adminApi.getShops();
      const currentActiveId = get().activeShopId;
      
      // If we have shops but no active shop selected, default to the first one
      let newActiveId = currentActiveId;
      if (shopsData.length > 0 && (!currentActiveId || !shopsData.find(s => s.id === currentActiveId))) {
        newActiveId = shopsData[0].id;
      }

      set({ 
        shops: shopsData, 
        activeShopId: newActiveId,
        isLoading: false 
      });
      
      return shopsData;
    } catch (err) {
      set({ 
        error: 'Mağazaları yükləmək mümkün olmadı', 
        isLoading: false,
        shops: []
      });
      console.error('Store fetchShops error:', err);
      return [];
    }
  },

  // Switch the active shop context
  setActiveShop: (shopId) => {
    set({ activeShopId: shopId });
  },
  
  // Clear context (e.g. on logout)
  clearStore: () => {
    set({ shops: [], activeShopId: null, error: null });
  }
}));
