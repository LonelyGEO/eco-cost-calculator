import { Ingredient } from '../../../data/recipes';
import { AppState, CraftingRecipe, Item } from './state';
import {
  getCraftingStationForRecipe,
  getProfessionOrThrow,
} from './state-getters';
import { evaluateDynamicValue } from './update-prices';

export interface EstimatedQuantities {
  inputs: Map<string, number>;
  products: Map<string, number>;
  byproducts: Map<string, number>;
  rootProducts: Set<string>;
}

function addQuantity(map: Map<string, number>, name: string, amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) return;
  map.set(name, (map.get(name) ?? 0) + amount);
}

function getItemPrice(state: AppState, name: string): number {
  return (
    state.inputs.get(name)?.price ??
    state.products.get(name)?.price ??
    Number.MAX_SAFE_INTEGER
  );
}

export function formatEstimatedQuantity(quantity: number): string {
  return new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 3,
  }).format(quantity);
}

/**
 * Estimates one crafting run for every top-level product, then propagates the
 * required quantities through all expanded product recipes.
 */
export function getEstimatedQuantities(state: AppState): EstimatedQuantities {
  const result: EstimatedQuantities = {
    inputs: new Map(),
    products: new Map(),
    byproducts: new Map(),
    rootProducts: new Set(),
  };
  const productNames = new Set(state.products.keys());
  const childProducts = new Set<string>();

  state.products.forEach((product) => {
    product.usedInRecipes.forEach((recipeName) => {
      const parentName = state.recipes.get(recipeName)?.mainProduct.name;
      if (
        parentName &&
        parentName !== product.name &&
        productNames.has(parentName)
      ) {
        childProducts.add(product.name);
      }
    });
  });

  const getActiveRecipe = (item: Item) =>
    Array.from(item.productOfRecipes)
      .map((name) => state.recipes.get(name))
      .find((recipe) => recipe?.mainProduct.name === item.name);

  const getDynamicQuantity = (
    recipe: CraftingRecipe,
    ingredient: Ingredient,
  ) => {
    const craftingStation = getCraftingStationForRecipe(state, recipe);
    const profession = getProfessionOrThrow(
      state,
      craftingStation.profession.name,
    );
    const quantity = evaluateDynamicValue({
      baseValue: ingredient.quantity,
      modifiers: ingredient.modifiers,
      action: 'ResourceCost',
      recipe,
      profession,
      craftingStation,
    });
    return recipe.batchSize
      ? Math.ceil(quantity * recipe.batchSize) / recipe.batchSize
      : quantity;
  };

  const getYieldQuantity = (
    recipe: CraftingRecipe,
    product: CraftingRecipe['mainProduct'],
  ) => {
    const craftingStation = getCraftingStationForRecipe(state, recipe);
    const profession = getProfessionOrThrow(
      state,
      craftingStation.profession.name,
    );
    return evaluateDynamicValue({
      baseValue: product.quantity,
      modifiers: product.modifiers,
      action: 'Yield',
      recipe,
      profession,
      craftingStation,
      isRefund: product.isRefund,
    });
  };

  const walkRecipe = (
    recipe: CraftingRecipe,
    craftCount: number,
    recipePath: Set<string>,
  ) => {
    if (recipePath.has(recipe.name) || !Number.isFinite(craftCount)) return;
    const nextPath = new Set(recipePath).add(recipe.name);

    const consumeItem = (name: string, quantity: number) => {
      const product = state.products.get(name);
      if (!product) {
        addQuantity(result.inputs, name, quantity);
        return;
      }

      addQuantity(result.products, name, quantity);
      const childRecipe = getActiveRecipe(product);
      if (!childRecipe) return;
      const outputQuantity = getYieldQuantity(
        childRecipe,
        childRecipe.mainProduct,
      );
      if (outputQuantity <= 0) return;
      walkRecipe(childRecipe, quantity / outputQuantity, nextPath);
    };

    recipe.ingredients.forEach((ingredient) => {
      const quantity = getDynamicQuantity(recipe, ingredient) * craftCount;
      if (ingredient.tag) {
        addQuantity(result.inputs, ingredient.tag, quantity);
        const selection = state.tagSelections.get(ingredient.tag);
        if (!selection?.candidates.length) return;

        if (selection.mode === 'cheapest') {
          const cheapest = [...selection.candidates].sort(
            (left, right) =>
              getItemPrice(state, left.name) - getItemPrice(state, right.name),
          )[0];
          if (cheapest) consumeItem(cheapest.name, quantity);
          return;
        }

        const selected = selection.candidates.filter(({ ratio }) => ratio > 0);
        const ratioTotal = selected.reduce(
          (total, { ratio }) => total + ratio,
          0,
        );
        if (ratioTotal <= 0) return;
        selected.forEach(({ name, ratio }) =>
          consumeItem(name, quantity * (ratio / ratioTotal)),
        );
        return;
      }

      if (ingredient.name) consumeItem(ingredient.name, quantity);
    });

    recipe.byproducts.forEach((byproduct) => {
      addQuantity(
        result.byproducts,
        byproduct.name,
        getYieldQuantity(recipe, byproduct) * craftCount,
      );
    });
  };

  const roots = Array.from(state.products.values()).filter(
    (product) => !childProducts.has(product.name),
  );
  roots.forEach((product) => {
    const recipe = getActiveRecipe(product);
    if (!recipe) return;
    result.rootProducts.add(product.name);
    addQuantity(
      result.products,
      product.name,
      getYieldQuantity(recipe, recipe.mainProduct),
    );
    walkRecipe(recipe, 1, new Set());
  });

  return result;
}
