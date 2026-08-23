import { Recipe } from '../../../../data/recipes';
import { ProcessActionProps } from '../state';
import { processAddRecipeAction } from './add-recipe.action';
import { processRemoveRecipeAction } from './remove-recipe.action';

interface SwitchProductRecipeActionProps extends ProcessActionProps {
  recipe: Recipe;
}

/** A product has one active production route. Selecting another recipe replaces it. */
export function switchProductRecipeAction({
  draft,
  recipe,
}: SwitchProductRecipeActionProps): void {
  const conflictingRecipes = Array.from(draft.recipes.values()).filter(
    (currentRecipe) =>
      currentRecipe.mainProduct.name === recipe.mainProduct.name &&
      currentRecipe.name !== recipe.name,
  );

  conflictingRecipes.forEach((currentRecipe) =>
    processRemoveRecipeAction({ draft, removedRecipe: currentRecipe }),
  );

  if (draft.recipes.has(recipe.name)) return;
  processAddRecipeAction({
    draft,
    addedRecipe: { ...recipe, price: 0, highlighted: false },
  });
}
