import {
  Bonus,
  Ingredient,
  Modifier,
  Recipe,
  modulesByName,
} from '../../../data/recipes';
import {
  AppState,
  CraftingRecipe,
  CraftingStation,
  Item,
  ProfessionState,
} from './state';

import {
  getCraftingStationForRecipe,
  getProfessionOrThrow,
  getRecipeOrThrow,
} from './state-getters';

// We need a custom entrypoint here. Byproduct relations to recipe price is reversed over normal products.

interface BonusAggregate {
  multiplier: number;
  additive: number;
  percentSum: number;
}

function bonusPassesFilters(bonus: Bonus, recipe: Recipe): boolean {
  const skillName = recipe.professions[0].name;
  if (bonus.skillTypes?.length && !bonus.skillTypes.includes(skillName))
    return false;
  if (bonus.excludedSkillTypes?.includes(skillName)) return false;
  if (bonus.itemTags?.length) {
    const productTags = new Set(
      recipe.products.flatMap((product) => product.itemTags),
    );
    if (!bonus.itemTags.some((tag) => productTags.has(tag))) return false;
  }
  return true;
}

function applyBonus(
  aggregate: BonusAggregate,
  bonus: Bonus,
  level: number,
  baseValue: number,
) {
  if (bonus.effectType === 'Multiplicative') {
    aggregate.multiplier *= bonus.value;
    return;
  }
  if (bonus.effectType === 'CappedMultiplicative') {
    let multiplier = 1 + (bonus.value - 1) * level;
    if (bonus.cap != null) {
      multiplier =
        bonus.value < 1
          ? Math.max(multiplier, bonus.cap)
          : Math.min(multiplier, bonus.cap);
    }
    aggregate.multiplier *= multiplier;
    return;
  }
  if (bonus.effectType === 'AdditivePercent') {
    aggregate.percentSum += bonus.value;
    return;
  }
  if (bonus.effectType === 'Additive') {
    aggregate.additive += baseValue < 0 ? -bonus.value : bonus.value;
  }
}

export function evaluateDynamicValue({
  baseValue,
  modifiers,
  action,
  recipe,
  profession,
  craftingStation,
  isRefund = false,
}: {
  baseValue: number;
  modifiers: Modifier[];
  action: Bonus['action'];
  recipe: Recipe;
  profession: ProfessionState;
  craftingStation: CraftingStation;
  isRefund?: boolean;
}): number {
  const aggregate: BonusAggregate = {
    multiplier: 1,
    additive: 0,
    percentSum: 0,
  };

  modifiers.forEach((modifier) => {
    if (modifier.dynamicType === 'Skill') {
      const level = Math.max(
        0,
        Math.min(profession.level, profession.laborReducePercent.length - 1),
      );
      aggregate.multiplier *= profession.laborReducePercent[level] ?? 1;
      return;
    }
    if (modifier.dynamicType !== 'Talent' || !modifier.item) return;
    const talent = profession.talents.find(
      (candidate) => candidate.name === modifier.item,
    );
    if (!talent) return;
    const selectedLevel = profession.selectedTalents[talent.groupName] ?? 0;
    if (selectedLevel <= 0 || profession.level < talent.unlockLevel) return;
    talent.bonuses
      .filter(
        (bonus) => bonus.action === action && bonusPassesFilters(bonus, recipe),
      )
      .forEach((bonus) =>
        applyBonus(aggregate, bonus, selectedLevel, baseValue),
      );
  });

  const modulesApply =
    action === 'LaborCost' ||
    action === 'CraftTime' ||
    (action === 'ResourceCost' && modifiers.length > 0) ||
    (action === 'Yield' && !isRefund);

  if (modulesApply) {
    Object.values(craftingStation.selectedModules)
      .map((moduleName) => modulesByName.get(moduleName))
      .filter((module): module is NonNullable<typeof module> => Boolean(module))
      .flatMap((module) => module.bonuses)
      .filter(
        (bonus) => bonus.action === action && bonusPassesFilters(bonus, recipe),
      )
      .forEach((bonus) => applyBonus(aggregate, bonus, 1, baseValue));
  }

  return (
    baseValue * aggregate.multiplier +
    aggregate.additive +
    baseValue * aggregate.percentSum
  );
}

interface UpdatePricesProps {
  draft: AppState;
  element: Item | CraftingRecipe;
}

// Marks a whole "dependency tree" of items and recipes for update.
// This is done to avoid cases where stale item prices are used in recipes
export function markForUpdate({ draft, element }: UpdatePricesProps) {
  if (draft.updating.has(element.name)) return;

  draft.updating.add(element.name);

  if ('usedInRecipes' in element) {
    element.usedInRecipes.forEach((recipeName) => {
      const recipe = draft.recipes.get(recipeName);
      recipe && markForUpdate({ draft, element: recipe });
    });
  }
  if ('mainProduct' in element) {
    const mainProduct = draft.products.get(element.mainProduct.name);
    mainProduct && markForUpdate({ draft, element: mainProduct });
  }
}

export function updatePrice({ draft, element }: UpdatePricesProps): void {
  // If the element cost was already recalculated, return now
  if (draft.updated.has(element.name)) {
    return;
  }
  try {
    if ('usedInRecipes' in element) {
      updateItemPrice({ draft, item: element });
    }
    if ('mainProduct' in element) {
      updateRecipePrice({ draft, recipe: element });
    }
  } catch (error) {
    // We expect to catch errors here.
    console.debug(error);
  } finally {
    // We use errors to bail out of calculations that have missing prereq updates.
    // We still need to continue with the recursion though
    if ('usedInRecipes' in element) {
      element.usedInRecipes.forEach((recipeName) => {
        const recipe = draft.recipes.get(recipeName);
        recipe && updatePrice({ draft, element: recipe });
      });
    }
    if ('mainProduct' in element) {
      const mainProduct = draft.products.get(element.mainProduct.name);
      mainProduct && updatePrice({ draft, element: mainProduct });
    }
  }
}

interface UpdateByproductPriceProps {
  draft: AppState;
  item: Item;
}
export function updateByproductPrice({
  draft,
  item,
}: UpdateByproductPriceProps) {
  item.byproductOfRecipes.forEach((recipeName) => {
    const recipe = getRecipeOrThrow(draft.recipes, recipeName);
    markForUpdate({ draft, element: recipe });
  });

  item.byproductOfRecipes.forEach((recipeName) => {
    const recipe = getRecipeOrThrow(draft.recipes, recipeName);
    updatePrice({ draft, element: recipe });
  });
}

interface UpdateItemPriceProps {
  draft: AppState;
  item: Item;
}

export function updateItemPrice({ draft, item }: UpdateItemPriceProps) {
  if (item.productOfRecipes.size === 0) {
    // This item isn't a product of anything, so it must be an item or byproduct.
    // Their prices are fixed through user-inputs and don't need to be updated.
    draft.updated.add(item.name);
    return;
  }
  let newPrice = Number.MAX_SAFE_INTEGER;

  item.productOfRecipes.forEach((recipeName) => {
    assertItemHasUpdated(draft, recipeName);
    const recipe = getRecipeOrThrow(draft.recipes, recipeName);
    newPrice = Math.min(newPrice, recipe.price);
  });

  item.price = newPrice;
  draft.updated.add(item.name);
}

function assertItemHasUpdated(draft: AppState, name: string): void {
  if (!draft.updating.has(name)) return;
  if (draft.updated.has(name)) return;

  throw new Error(`${name} is marked for update but not updated yet!`);
}

function getPricedItem(draft: AppState, name: string): Item {
  const item =
    draft.inputs.get(name) ??
    draft.products.get(name) ??
    draft.byproducts.get(name);
  if (!item) throw new Error(`could not find ingredient with key ${name}`);
  return item;
}

export function getIngredientUnitPrice(
  draft: AppState,
  ingredient: Ingredient,
): number {
  if (ingredient.tag) {
    const selection = draft.tagSelections.get(ingredient.tag);
    if (selection?.candidates.length) {
      const candidates = selection.candidates.map(({ name, ratio }) => {
        assertItemHasUpdated(draft, name);
        return { price: getPricedItem(draft, name).price, ratio };
      });
      if (selection.mode === 'cheapest') {
        return Math.min(...candidates.map(({ price }) => price));
      }

      const positive = candidates.filter(({ ratio }) => ratio > 0);
      const ratioTotal = positive.reduce((sum, { ratio }) => sum + ratio, 0);
      if (ratioTotal > 0) {
        return (
          positive.reduce((sum, { price, ratio }) => sum + price * ratio, 0) /
          ratioTotal
        );
      }
    }
  }

  const key = (ingredient.name ?? ingredient.tag) as string;
  assertItemHasUpdated(draft, key);
  return getPricedItem(draft, key).price;
}

interface UpdateRecipePriceProps {
  draft: AppState;
  recipe: CraftingRecipe;
}
function updateRecipePrice({ draft, recipe }: UpdateRecipePriceProps) {
  // calculate own price
  const craftingStation = getCraftingStationForRecipe(draft, recipe);
  const profession = getProfessionOrThrow(
    draft,
    craftingStation.profession.name,
  );

  const ingredientsCost = recipe.ingredients.reduce((cost, ingredient) => {
    const unitPrice = getIngredientUnitPrice(draft, ingredient);
    const itemQuantity = evaluateDynamicValue({
      baseValue: ingredient.quantity,
      modifiers: ingredient.modifiers,
      action: 'ResourceCost',
      recipe,
      profession,
      craftingStation,
    });

    const batchedQuantity = recipe.batchSize
      ? Math.ceil(itemQuantity * recipe.batchSize) / recipe.batchSize
      : itemQuantity;

    return cost + batchedQuantity * unitPrice;
  }, 0);

  const calorieCost =
    (draft.calorieCost *
      evaluateDynamicValue({
        baseValue: recipe.calories || 0,
        modifiers: recipe.laborModifiers,
        action: 'LaborCost',
        recipe,
        profession,
        craftingStation,
      })) /
    1000;

  const totalCost = ingredientsCost + calorieCost + (recipe.fixedCost ?? 0);

  const byproductCost = recipe.byproducts.reduce((cost, product) => {
    const byproduct = draft.byproducts.get(product.name);
    const quantity = evaluateDynamicValue({
      baseValue: product.quantity,
      modifiers: product.modifiers,
      action: 'Yield',
      recipe,
      profession,
      craftingStation,
      isRefund: product.isRefund,
    });
    return cost + (byproduct?.price || 0) * quantity;
  }, 0);

  const mainProductQuantity = evaluateDynamicValue({
    baseValue: recipe.mainProduct.quantity,
    modifiers: recipe.mainProduct.modifiers,
    action: 'Yield',
    recipe,
    profession,
    craftingStation,
    isRefund: recipe.mainProduct.isRefund,
  });

  const margin = Math.max(1 + (recipe.margin || draft.margin), 1);

  recipe.price =
    ((totalCost - byproductCost) /
      Math.max(mainProductQuantity, Number.EPSILON)) *
    margin;

  draft.updated.add(recipe.name);
}
