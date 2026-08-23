import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { Recipe, recipes } from '../../data/recipes';
import {
  AppState,
  CraftingRecipe,
  CraftingRecipeMap,
  initialState,
  Item,
  ItemMap,
} from '../common/state/state';
import {
  processAddRecipeAction,
  processAddRecipeFromInputAction,
} from '../common/state/state-actions/add-recipe.action';
import { switchProductRecipeAction } from '../common/state/state-actions/switch-product-recipe.action';
import {
  buildProductForest,
  buildProductTree,
  Product,
} from './products.index';

function blankState(): AppState {
  return {
    ...initialState,
    inputs: new Map(),
    products: new Map(),
    recipes: new Map(),
    byproducts: new Map(),
    craftingStations: new Map(),
    professions: new Map(),
    updating: new Set(),
    updated: new Set(),
    customRecipes: new Map(),
    tagSelections: new Map(),
    data: recipes,
  };
}

function addRecipe(draft: AppState, recipe: Recipe): void {
  processAddRecipeAction({
    draft,
    addedRecipe: { ...recipe, price: 0, highlighted: false },
  });
}

function deepProductTree(levels: number): {
  products: ItemMap;
  recipes: CraftingRecipeMap;
} {
  const products: ItemMap = new Map();
  const recipeMap: CraftingRecipeMap = new Map();

  for (let index = 0; index < levels; index += 1) {
    const productName = `DeepProduct${index}`;
    const recipeName = `DeepRecipe${index}`;
    products.set(productName, {
      canBeProduced: true,
      highlighted: false,
      name: productName,
      displayName: `深层产品${index}`,
      usedInRecipes:
        index === 0 ? new Set() : new Set([`DeepRecipe${index - 1}`]),
      productOfRecipes: new Set([recipeName]),
      byproductOfRecipes: new Set(),
      price: index,
    } as Item);
    recipeMap.set(recipeName, {
      name: recipeName,
      displayName: `深层配方${index}`,
      localizedName: `深层配方${index}`,
      mainProduct: { name: productName },
      price: 0,
      highlighted: false,
    } as CraftingRecipe);
  }

  return { products, recipes: recipeMap };
}

describe('product recipe routes and hierarchy', () => {
  it('replaces the active recipe when a product route is switched', () => {
    const draft = blankState();
    const petroleumRecipe = recipes.find(
      (recipe) => recipe.name === 'LubricantRecipe',
    )!;
    const greaseRecipe = recipes.find(
      (recipe) => recipe.name === 'GreaseRecipe',
    )!;
    addRecipe(draft, petroleumRecipe);

    switchProductRecipeAction({ draft, recipe: greaseRecipe });

    expect(draft.recipes.has('LubricantRecipe')).toBe(false);
    expect(draft.recipes.has('GreaseRecipe')).toBe(true);
    expect(
      Array.from(draft.products.get('LubricantItem')?.productOfRecipes ?? []),
    ).toEqual(['GreaseRecipe']);
    expect(draft.inputs.has('PetroleumItem')).toBe(false);
    expect(draft.inputs.has('TallowItem')).toBe(true);
  });

  it('places recipes expanded from an ingredient below their parent product', () => {
    const draft = blankState();
    const rootRecipe = recipes.find(
      (recipe) => recipe.name === 'EngineeringResearchPaperAdvancedRecipe',
    )!;
    addRecipe(draft, rootRecipe);
    processAddRecipeFromInputAction({
      draft,
      input: draft.inputs.get('WaterwheelItem')!,
    });

    const rows = buildProductTree(draft.products, draft.recipes);
    const root = rows.find(
      ({ product }) => product.name === 'EngineeringResearchPaperAdvancedItem',
    );
    const waterwheel = rows.find(
      ({ product }) => product.name === 'WaterwheelItem',
    );

    expect(root?.depth).toBe(0);
    expect(waterwheel?.depth).toBe(1);
    expect(rows.indexOf(root!)).toBeLessThan(rows.indexOf(waterwheel!));
  });

  it('keeps every level in a product tree deeper than four levels', () => {
    const state = deepProductTree(7);
    const forest = buildProductForest(state.products, state.recipes);
    const rows = buildProductTree(state.products, state.recipes);

    expect(forest).toHaveLength(1);
    expect(rows.map(({ depth }) => depth)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(rows[6].product.name).toBe('DeepProduct6');
  });

  it('collapses and restores only the selected product subtree', () => {
    const state = deepProductTree(7);
    const { getByLabelText, getByText, queryByText, container } = render(
      React.createElement(Product, {
        dispatch: jest.fn(),
        products: state.products,
        recipes: state.recipes,
        data: [],
      }),
    );

    expect(getByText('深层产品6')).toBeInTheDocument();
    expect(container.querySelectorAll('ul[role="group"]')).toHaveLength(6);

    fireEvent.click(getByLabelText('折叠深层产品2的下级产品'));
    expect(queryByText('深层产品3')).not.toBeInTheDocument();
    expect(getByText('深层产品2')).toBeInTheDocument();

    fireEvent.click(getByLabelText('展开深层产品2的下级产品'));
    expect(getByText('深层产品6')).toBeInTheDocument();
  });
});
