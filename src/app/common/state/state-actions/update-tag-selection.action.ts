import { itemsByName } from '../../../../data/recipes';
import {
  AppState,
  CraftingRecipe,
  Item,
  ProcessActionProps,
  TagSelection,
} from '../state';
import { markForUpdate, updatePrice } from '../update-prices';

function createSelectedItem(draft: AppState, itemName: string): Item {
  const definition = itemsByName.get(itemName);
  return {
    highlighted: false,
    displayName: definition?.displayName ?? itemName.replace(/Item$/, ''),
    name: itemName,
    price: 0,
    usedInRecipes: new Set(),
    productOfRecipes: new Set(),
    byproductOfRecipes: new Set(),
    canBeProduced: draft.data.some(
      (recipe) => recipe.mainProduct.name === itemName,
    ),
  };
}

/** Keep concrete members of a selected tag connected to every recipe using it. */
export function syncTagSelectionInputs(draft: AppState): void {
  const allItems = () => [
    ...draft.inputs.values(),
    ...draft.products.values(),
    ...draft.byproducts.values(),
  ];

  allItems().forEach((item) => item.usedInRecipes.clear());

  draft.recipes.forEach((recipe) => {
    recipe.ingredients.forEach((ingredient) => {
      const key = (ingredient.name ?? ingredient.tag) as string;
      const existing =
        draft.inputs.get(key) ??
        draft.products.get(key) ??
        draft.byproducts.get(key);
      existing?.usedInRecipes.add(recipe.name);

      if (!ingredient.tag) return;
      const selection = draft.tagSelections.get(ingredient.tag);
      selection?.candidates.forEach(({ name }) => {
        let item =
          draft.inputs.get(name) ??
          draft.products.get(name) ??
          draft.byproducts.get(name);
        if (!item) {
          item = createSelectedItem(draft, name);
          draft.inputs.set(name, item);
        }
        item.usedInRecipes.add(recipe.name);
      });
    });
  });

  for (const [name, item] of draft.inputs) {
    if (item.usedInRecipes.size === 0) draft.inputs.delete(name);
  }
}

interface UpdateTagSelectionProps extends ProcessActionProps {
  tagName: string;
  selection: TagSelection | null;
}

export function updateTagSelectionAction({
  draft,
  tagName,
  selection,
}: UpdateTagSelectionProps): void {
  if (selection?.candidates.length) {
    draft.tagSelections.set(tagName, selection);
  } else {
    draft.tagSelections.delete(tagName);
  }

  syncTagSelectionInputs(draft);
  const affectedRecipes: CraftingRecipe[] = [];
  draft.recipes.forEach((recipe) => {
    if (recipe.ingredients.some((ingredient) => ingredient.tag === tagName)) {
      affectedRecipes.push(recipe);
      markForUpdate({ draft, element: recipe });
    }
  });
  affectedRecipes.forEach((recipe) => updatePrice({ draft, element: recipe }));
}
