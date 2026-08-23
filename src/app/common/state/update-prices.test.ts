import { recipes } from '../../../data/recipes';
import {
  AppState,
  CraftingStation,
  Item,
  ProfessionState,
  initialState,
} from './state';
import { evaluateDynamicValue, getIngredientUnitPrice } from './update-prices';

describe('ECO 14 dynamic values', () => {
  const recipe = recipes.find(
    (candidate) => candidate.name === 'AsphaltConcreteRecipe',
  )!;
  const profession: ProfessionState = {
    ...recipe.professions[0],
    level: 1,
    selectedTalents: {},
  };
  const craftingStation: CraftingStation = {
    name: recipe.table,
    displayName: recipe.tableDisplayName,
    localizedName: recipe.tableLocalizedName,
    profession,
    moduleSlots: ['AdvancedModule'],
    pluginModules: ['AdvancedUpgradeItem'],
    selectedModules: { AdvancedModule: 'AdvancedUpgradeItem' },
    usedByRecipes: new Set(),
  };

  it('applies module resource bonuses to dynamic ingredients', () => {
    const ingredient = recipe.ingredients.find(
      (candidate) => candidate.tag === 'CrushedRock',
    )!;

    expect(
      evaluateDynamicValue({
        baseValue: ingredient.quantity,
        modifiers: ingredient.modifiers,
        action: 'ResourceCost',
        recipe,
        profession,
        craftingStation,
      }),
    ).toBeCloseTo(9);
  });

  it('combines the new skill labor curve and module labor bonus', () => {
    expect(
      evaluateDynamicValue({
        baseValue: recipe.calories,
        modifiers: recipe.laborModifiers,
        action: 'LaborCost',
        recipe,
        profession,
        craftingStation,
      }),
    ).toBeCloseTo(recipe.calories * 0.7);
  });

  it('applies level-scaled capped talent bonuses', () => {
    const talentName = 'AdvancedMasonryCoastalRockTalent';
    const talentRecipe = recipes.find((candidate) =>
      candidate.ingredients.some((ingredient) =>
        ingredient.modifiers.some((modifier) => modifier.item === talentName),
      ),
    )!;
    const ingredient = talentRecipe.ingredients.find((candidate) =>
      candidate.modifiers.some((modifier) => modifier.item === talentName),
    )!;
    const talent = talentRecipe.professions[0].talents.find(
      (candidate) => candidate.name === talentName,
    )!;
    const talentProfession: ProfessionState = {
      ...talentRecipe.professions[0],
      level: 7,
      selectedTalents: { [talent.groupName]: 5 },
    };
    const talentStation: CraftingStation = {
      name: talentRecipe.table,
      displayName: talentRecipe.tableDisplayName,
      localizedName: talentRecipe.tableLocalizedName,
      profession: talentProfession,
      moduleSlots: [],
      pluginModules: [],
      selectedModules: {},
      usedByRecipes: new Set(),
    };

    expect(
      evaluateDynamicValue({
        baseValue: ingredient.quantity,
        modifiers: ingredient.modifiers,
        action: 'ResourceCost',
        recipe: talentRecipe,
        profession: talentProfession,
        craftingStation: talentStation,
      }),
    ).toBeCloseTo(ingredient.quantity * 0.75);
  });

  it('uses the cheapest allowed tag member or a fixed weighted mix', () => {
    const fabricIngredient = recipes
      .find(
        (candidate) =>
          candidate.name === 'GatheringResearchPaperAdvancedRecipe',
      )
      ?.ingredients.find((ingredient) => ingredient.tag === 'Fabric')!;
    const makeItem = (name: string, price: number): Item => ({
      name,
      displayName: name,
      price,
      highlighted: false,
      canBeProduced: true,
      usedInRecipes: new Set(),
      productOfRecipes: new Set(),
      byproductOfRecipes: new Set(),
    });
    const draft: AppState = {
      ...initialState,
      inputs: new Map([
        ['CottonFabricItem', makeItem('CottonFabricItem', 10)],
        ['LinenFabricItem', makeItem('LinenFabricItem', 20)],
      ]),
      products: new Map(),
      byproducts: new Map(),
      updating: new Set(),
      updated: new Set(),
      tagSelections: new Map([
        [
          'Fabric',
          {
            mode: 'cheapest',
            candidates: [
              { name: 'CottonFabricItem', ratio: 0 },
              { name: 'LinenFabricItem', ratio: 0 },
            ],
          },
        ],
      ]),
    };

    expect(getIngredientUnitPrice(draft, fabricIngredient)).toBe(10);
    draft.tagSelections.set('Fabric', {
      mode: 'mix',
      candidates: [
        { name: 'CottonFabricItem', ratio: 25 },
        { name: 'LinenFabricItem', ratio: 75 },
      ],
    });
    expect(getIngredientUnitPrice(draft, fabricIngredient)).toBe(17.5);
  });
});
