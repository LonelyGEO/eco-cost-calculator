import { Recipe, recipes } from '../../data/recipes';
import { AppState, initialState } from '../common/state/state';
import {
  processAddRecipeAction,
  processAddRecipeFromInputAction,
} from '../common/state/state-actions/add-recipe.action';
import { switchProductRecipeAction } from '../common/state/state-actions/switch-product-recipe.action';
import { buildProductTree } from './products.index';

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
});
