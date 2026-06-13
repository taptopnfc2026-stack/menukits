import assert from 'node:assert/strict';
import { dbRowToMenu } from '../src/lib/menu-row.ts';

const row = {
  id: 'cloud-menu-id',
  name: 'Menu (1 file)',
  is_public: true,
  created_at: '2026-06-13T00:00:00.000Z',
  updated_at: '2026-06-13T00:01:00.000Z',
  settings: {
    id: '1780000000000',
    title: 'Menu (1 file)',
    sections: [
      {
        id: 'section-1',
        name: 'Starters',
        isExpanded: true,
        dishes: [
          {
            id: 'dish-1',
            name: 'Soup',
            description: '',
            price: 8,
            allergens: [],
            dietaryTags: [],
            isVisible: true,
          },
        ],
      },
    ],
    isVisible: false,
    createdAt: '2026-06-12T00:00:00.000Z',
    updatedAt: '2026-06-12T00:01:00.000Z',
  },
};

const menu = dbRowToMenu(row);

assert.equal(menu.id, 'cloud-menu-id');
assert.equal(menu.title, 'Menu (1 file)');
assert.equal(menu.sections.length, 1);
assert.equal(menu.sections[0].dishes.length, 1);
assert.equal(menu.isVisible, true);
assert.equal(menu.createdAt, row.created_at);
assert.equal(menu.updatedAt, row.updated_at);

console.log('menu row mapping ok');
