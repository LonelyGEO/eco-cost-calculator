import { recipes } from '../../../data/recipes';
import { getEstimatedQuantities } from './get-bill-of-materials';
import { AppState, initialState } from './state';
import {
  processAddRecipeAction,
  processAddRecipeFromInputAction,
} from './state-actions/add-recipe.action';

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

describe('estimated crafting quantities', () => {
  it('propagates required quantities through an expanded product recipe', () => {
    const state = blankState();
    const rootRecipe = recipes.find(
      (recipe) => recipe.name === 'EngineeringResearchPaperAdvancedRecipe',
    )!;
    processAddRecipeAction({
      draft: state,
      addedRecipe: { ...rootRecipe, price: 0, highlighted: false },
    });

    const beforeExpansion = getEstimatedQuantities(state);
    const requiredWaterwheels = beforeExpansion.inputs.get('WaterwheelItem')!;
    expect(requiredWaterwheels).toBeGreaterThan(0);

    processAddRecipeFromInputAction({
      draft: state,
      input: state.inputs.get('WaterwheelItem')!,
    });
    const afterExpansion = getEstimatedQuantities(state);

    expect(afterExpansion.rootProducts).toEqual(
      new Set(['EngineeringResearchPaperAdvancedItem']),
    );
    expect(afterExpansion.products.get('WaterwheelItem')).toBeCloseTo(
      requiredWaterwheels,
    );
    expect(afterExpansion.inputs.get('WoodenGearItem')).toBeGreaterThan(0);
  });

  it('includes the manual material reduction in estimated input usage', () => {
    const state = blankState();
    const recipe = recipes.find(
      (candidate) =>
        candidate.name === 'EngineeringResearchPaperAdvancedRecipe',
    )!;
    processAddRecipeAction({
      draft: state,
      addedRecipe: { ...recipe, price: 0, highlighted: false },
    });
    const normalUsage =
      getEstimatedQuantities(state).inputs.get('WaterwheelItem')!;

    state.recipes.get(recipe.name)!.resourceReduction = 50;
    const reducedUsage =
      getEstimatedQuantities(state).inputs.get('WaterwheelItem')!;

    expect(reducedUsage).toBeCloseTo(normalUsage * 0.5);
  });
});
