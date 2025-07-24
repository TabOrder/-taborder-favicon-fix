// Combo Service for Frontend Integration
// Handles all combo-related API calls and data management

export interface ComboItem {
  id: string;
  name: string;
  brand?: string;
  size?: string;
  price: number;
  quantity: number;
  discount_percentage?: number;
}

export interface Combo {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  items: ComboItem[];
  keywords: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ComboSearchResult {
  success: boolean;
  combos: Combo[];
  total: number;
  categories: string[];
  source: 'database' | 'dynamic_fallback';
}

export interface ComboStatistics {
  total_combos: number;
  active_combos: number;
  inactive_combos: number;
  categories: string[];
  category_count: number;
  price_stats: {
    average: number;
    minimum: number;
    maximum: number;
    range: number;
  };
  last_updated: string;
}

class ComboService {
  private baseUrl: string;
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(baseUrl: string = 'http://localhost:10000') {
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`ComboService error for ${endpoint}:`, error);
      throw error;
    }
  }

  private getCacheKey(endpoint: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${endpoint}${paramString}`;
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.cacheTimeout;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private getCache(key: string): any {
    const cached = this.cache.get(key);
    return cached?.data;
  }

  private clearCache(): void {
    this.cache.clear();
  }

  // Get all combos
  async getAllCombos(useCache: boolean = true): Promise<ComboSearchResult> {
    const cacheKey = this.getCacheKey('/api/combos');
    
    if (useCache && this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    const result = await this.makeRequest<ComboSearchResult>('/api/combos');
    
    if (useCache) {
      this.setCache(cacheKey, result);
    }

    return result;
  }

  // Get combo by ID
  async getComboById(id: number): Promise<Combo | null> {
    const cacheKey = this.getCacheKey(`/api/combos/${id}`);
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const result = await this.makeRequest<{ success: boolean; combo: Combo }>(`/api/combos/${id}`);
      this.setCache(cacheKey, result.combo);
      return result.combo;
    } catch (error) {
      console.error(`Failed to get combo ${id}:`, error);
      return null;
    }
  }

  // Search combos
  async searchCombos(query: string): Promise<Combo[]> {
    const cacheKey = this.getCacheKey('/api/combos/search', { query });
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const result = await this.makeRequest<{ success: boolean; combos: Combo[] }>(
        `/api/combos/search?q=${encodeURIComponent(query)}`
      );
      
      this.setCache(cacheKey, result.combos);
      return result.combos;
    } catch (error) {
      console.error(`Failed to search combos with query "${query}":`, error);
      return [];
    }
  }

  // Get combos by category
  async getCombosByCategory(category: string): Promise<Combo[]> {
    const cacheKey = this.getCacheKey('/api/combos/category', { category });
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const result = await this.makeRequest<{ success: boolean; combos: Combo[] }>(
        `/api/combos/category/${encodeURIComponent(category)}`
      );
      
      this.setCache(cacheKey, result.combos);
      return result.combos;
    } catch (error) {
      console.error(`Failed to get combos for category "${category}":`, error);
      return [];
    }
  }

  // Get combo statistics
  async getComboStatistics(): Promise<ComboStatistics | null> {
    const cacheKey = this.getCacheKey('/api/combos/stats');
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const result = await this.makeRequest<{ success: boolean; stats: ComboStatistics }>('/api/combos/stats');
      this.setCache(cacheKey, result.stats);
      return result.stats;
    } catch (error) {
      console.error('Failed to get combo statistics:', error);
      return null;
    }
  }

  // Add new combo (requires authentication)
  async addCombo(comboData: Omit<Combo, 'id' | 'created_at' | 'updated_at'>, token: string): Promise<Combo | null> {
    try {
      const result = await this.makeRequest<{ success: boolean; combo: Combo }>('/api/combos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(comboData),
      });

      if (result.success) {
        this.clearCache(); // Clear cache when adding new combo
        return result.combo;
      }
      return null;
    } catch (error) {
      console.error('Failed to add combo:', error);
      return null;
    }
  }

  // Update combo (requires authentication)
  async updateCombo(id: number, updateData: Partial<Combo>, token: string): Promise<Combo | null> {
    try {
      const result = await this.makeRequest<{ success: boolean; combo: Combo }>(`/api/combos/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (result.success) {
        this.clearCache(); // Clear cache when updating combo
        return result.combo;
      }
      return null;
    } catch (error) {
      console.error(`Failed to update combo ${id}:`, error);
      return null;
    }
  }

  // Delete combo (requires authentication)
  async deleteCombo(id: number, token: string): Promise<boolean> {
    try {
      const result = await this.makeRequest<{ success: boolean }>(`/api/combos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (result.success) {
        this.clearCache(); // Clear cache when deleting combo
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to delete combo ${id}:`, error);
      return false;
    }
  }

  // Toggle combo status (requires authentication)
  async toggleComboStatus(id: number, token: string): Promise<Combo | null> {
    try {
      const result = await this.makeRequest<{ success: boolean; combo: Combo }>(`/api/combos/${id}/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (result.success) {
        this.clearCache(); // Clear cache when toggling combo
        return result.combo;
      }
      return null;
    } catch (error) {
      console.error(`Failed to toggle combo ${id}:`, error);
      return null;
    }
  }

  // Fuzzy search with local fallback
  async fuzzySearch(query: string): Promise<Combo[]> {
    try {
      // Try API search first
      const apiResults = await this.searchCombos(query);
      if (apiResults.length > 0) {
        return apiResults;
      }

      // Fallback to local search if API fails
      const allCombos = await this.getAllCombos();
      return this.localFuzzySearch(allCombos.combos, query);
    } catch (error) {
      console.error('Fuzzy search failed:', error);
      return [];
    }
  }

  // Local fuzzy search implementation
  private localFuzzySearch(combos: Combo[], query: string): Combo[] {
    const searchTerm = query.toLowerCase();
    const matches: Array<{ combo: Combo; score: number }> = [];

    for (const combo of combos) {
      if (!combo.is_active) continue;

      let score = 0;

      // Name match (highest priority)
      if (combo.name.toLowerCase().includes(searchTerm)) {
        score += 10;
      }

      // Category match
      if (combo.category.toLowerCase().includes(searchTerm)) {
        score += 8;
      }

      // Keywords match
      for (const keyword of combo.keywords) {
        if (keyword.toLowerCase().includes(searchTerm)) {
          score += 5;
        }
      }

      // Description match
      if (combo.description.toLowerCase().includes(searchTerm)) {
        score += 3;
      }

      // Items match
      for (const item of combo.items) {
        if (item.name.toLowerCase().includes(searchTerm)) {
          score += 2;
        }
      }

      if (score > 0) {
        matches.push({ combo, score });
      }
    }

    // Sort by score and return top results
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(match => match.combo);
  }

  // Get popular combos (based on category or price)
  async getPopularCombos(limit: number = 6): Promise<Combo[]> {
    try {
      const allCombos = await this.getAllCombos();
      
      // Sort by price (assuming higher price = more popular)
      // In a real system, this would be based on actual order data
      return allCombos.combos
        .filter(combo => combo.is_active)
        .sort((a, b) => b.price - a.price)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get popular combos:', error);
      return [];
    }
  }

  // Get combos by price range
  async getCombosByPriceRange(minPrice: number, maxPrice: number): Promise<Combo[]> {
    try {
      const allCombos = await this.getAllCombos();
      
      return allCombos.combos.filter(combo => 
        combo.is_active && 
        combo.price >= minPrice && 
        combo.price <= maxPrice
      );
    } catch (error) {
      console.error('Failed to get combos by price range:', error);
      return [];
    }
  }

  // Calculate combo savings
  calculateSavings(combo: Combo): { originalPrice: number; savings: number; savingsPercentage: number } {
    const originalPrice = combo.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    const savings = originalPrice - combo.price;
    const savingsPercentage = originalPrice > 0 ? (savings / originalPrice) * 100 : 0;

    return {
      originalPrice,
      savings,
      savingsPercentage: Math.round(savingsPercentage * 100) / 100,
    };
  }

  // Format combo for display
  formatComboForDisplay(combo: Combo): {
    id: number;
    name: string;
    description: string;
    price: string;
    category: string;
    items: string[];
    savings: string;
    isActive: boolean;
  } {
    const savings = this.calculateSavings(combo);
    
    return {
      id: combo.id,
      name: combo.name,
      description: combo.description,
      price: `R${combo.price.toFixed(2)}`,
      category: combo.category.charAt(0).toUpperCase() + combo.category.slice(1),
      items: combo.items.map(item => `${item.name} x${item.quantity}`),
      savings: savings.savings > 0 ? `Save R${savings.savings.toFixed(2)} (${savings.savingsPercentage}%)` : '',
      isActive: combo.is_active,
    };
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Set base URL (useful for switching between environments)
  setBaseUrl(url: string): void {
    this.baseUrl = url;
    this.clearCache(); // Clear cache when changing base URL
  }

  // Get current base URL
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

// Export singleton instance
export const comboService = new ComboService();

// Export for testing or multiple instances
export { ComboService };

// Default export
export default comboService; 