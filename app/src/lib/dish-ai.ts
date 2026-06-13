import type { Dish } from '@/types';

export const DIETARY_TAGS = [
  'Vegan',
  'Vegetarian',
  'Gluten-free',
  'Lactose-free',
  'Dairy-free',
  'Spicy',
];

const CATEGORY_IMAGES: Array<{ keywords: string[]; url: string }> = [
  { keywords: ['foie gras', 'terrine', 'pate', 'pâté'], url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=600&fit=crop&auto=format' },
  { keywords: ['escargot', 'snail'], url: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&h=600&fit=crop&auto=format' },
  { keywords: ['salmon', 'tuna', 'fish', 'cod', 'bass'], url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&h=600&fit=crop&auto=format' },
  { keywords: ['lobster', 'shrimp', 'prawn', 'crab', 'seafood'], url: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&h=600&fit=crop&auto=format' },
  { keywords: ['salad', 'mesclun', 'greens', 'vegetable'], url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=600&fit=crop&auto=format' },
  { keywords: ['soup', 'bisque', 'broth', 'consomme', 'consommé'], url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&h=600&fit=crop&auto=format' },
  { keywords: ['steak', 'beef', 'veal', 'ribeye', 'filet'], url: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&h=600&fit=crop&auto=format' },
  { keywords: ['pork', 'duck', 'chicken', 'lamb'], url: 'https://images.unsplash.com/photo-1432139509613-5c4255a1d1c5?w=600&h=600&fit=crop&auto=format' },
  { keywords: ['pasta', 'spaghetti', 'linguine', 'penne'], url: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600&h=600&fit=crop&auto=format' },
  { keywords: ['pizza', 'margherita'], url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&h=600&fit=crop&auto=format' },
  { keywords: ['cheese', 'fromage', 'brie', 'roquefort'], url: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&h=600&fit=crop&auto=format' },
  { keywords: ['cake', 'mousse', 'dessert', 'tiramisu', 'brulee', 'brûlée'], url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=600&fit=crop&auto=format' },
  { keywords: ['wine', 'bordeaux', 'rouge'], url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&h=600&fit=crop&auto=format' },
];

const ANIMAL_WORDS = [
  'beef', 'veal', 'pork', 'chicken', 'duck', 'lamb', 'fish', 'salmon', 'tuna', 'cod',
  'bass', 'shrimp', 'prawn', 'crab', 'lobster', 'mollusc', 'mollusk', 'snail',
  'escargot', 'oyster', 'mussel', 'scallop', 'egg', 'milk', 'cream', 'butter',
  'cheese', 'brie', 'roquefort', 'parmesan', 'mozzarella', 'yogurt',
];

const MEAT_OR_FISH_WORDS = [
  'beef', 'veal', 'pork', 'chicken', 'duck', 'lamb', 'fish', 'salmon', 'tuna',
  'cod', 'bass', 'shrimp', 'prawn', 'crab', 'lobster', 'snail', 'escargot',
  'oyster', 'mussel', 'scallop',
];

const DAIRY_WORDS = ['milk', 'cream', 'butter', 'cheese', 'brie', 'roquefort', 'parmesan', 'mozzarella', 'yogurt', 'lactose'];
const GLUTEN_WORDS = ['bread', 'flour', 'wheat', 'barley', 'rye', 'pasta', 'noodle', 'cake', 'pastry', 'crust', 'batter', 'breadcrumb', 'couscous'];
const PLANT_FORWARD_WORDS = ['vegan', 'vegetable', 'vegetarian', 'salad', 'greens', 'tomato', 'onion', 'mushroom', 'rice', 'bean', 'tofu', 'lentil', 'chickpea'];
const SPICY_WORDS = ['spicy', 'chili', 'chilli', 'jalapeno', 'jalapeño', 'pepper', 'curry', 'harissa', 'sriracha', 'hot sauce'];

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

export function suggestDishImage(dish: Pick<Dish, 'name' | 'description'>): string {
  const text = `${dish.name || ''} ${dish.description || ''}`.toLowerCase();
  const match = CATEGORY_IMAGES.find((item) => item.keywords.some((keyword) => text.includes(keyword)));
  if (match) return `${match.url}&sig=${encodeURIComponent(dish.name || 'dish')}`;

  const query = encodeURIComponent(`${dish.name || 'restaurant dish'} plated restaurant food`);
  return `https://source.unsplash.com/600x600/?${query}`;
}

export function suggestDietaryTags(dish: Pick<Dish, 'name' | 'description' | 'allergens' | 'dietaryTags'>): string[] {
  const text = `${dish.name || ''} ${dish.description || ''} ${(dish.allergens || []).join(' ')}`.toLowerCase();
  const next = new Set(dish.dietaryTags || []);
  const hasAnimal = includesAny(text, ANIMAL_WORDS);
  const hasMeatOrFish = includesAny(text, MEAT_OR_FISH_WORDS);
  const hasDairy = includesAny(text, DAIRY_WORDS) || (dish.allergens || []).includes('Milk');
  const hasGluten = includesAny(text, GLUTEN_WORDS) || (dish.allergens || []).includes('Gluten');

  if (text.includes('vegan') || (includesAny(text, PLANT_FORWARD_WORDS) && !hasAnimal)) {
    next.add('Vegan');
    next.add('Vegetarian');
    next.add('Dairy-free');
    next.add('Lactose-free');
  } else if (text.includes('vegetarian') || (includesAny(text, PLANT_FORWARD_WORDS) && !hasMeatOrFish)) {
    next.add('Vegetarian');
  }

  if (text.includes('gluten-free') || (!hasGluten && (text.includes('rice') || text.includes('risotto') || text.includes('salad') || text.includes('steak') || text.includes('grilled') || text.includes('wine')))) {
    next.add('Gluten-free');
  }

  if (text.includes('dairy-free') || text.includes('lactose-free') || (!hasDairy && (next.has('Vegan') || text.includes('grilled') || text.includes('wine')))) {
    next.add('Dairy-free');
    next.add('Lactose-free');
  }

  if (includesAny(text, SPICY_WORDS)) {
    next.add('Spicy');
  }

  return DIETARY_TAGS.filter((tag) => next.has(tag));
}
