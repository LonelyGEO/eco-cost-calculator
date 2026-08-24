import {
  AppState,
  mergeRecipeData,
  ProcessActionProps,
  reviver,
} from '../state';
import { syncTagSelectionInputs } from './update-tag-selection.action';

interface ImportProfileActionProps extends ProcessActionProps {
  profileString: string;
}

export const importProfileAction = ({
  draft,
  profileString,
}: ImportProfileActionProps) => {
  try {
    const json: AppState = JSON.parse(profileString, reviver);

    draft.customRecipes = json.customRecipes ?? new Map();
    draft.data = mergeRecipeData(draft.customRecipes);
    draft.craftingStations = json.craftingStations;
    draft.professions = json.professions;
    draft.recipes = json.recipes;
    draft.inputs = json.inputs;
    draft.products = json.products;
    draft.byproducts = json.byproducts;
    draft.tagSelections = json.tagSelections ?? new Map();
    draft.lumberRidgeEnabled = json.lumberRidgeEnabled ?? false;
    draft.calorieCost = json.calorieCost;
    draft.margin = json.margin;
    syncTagSelectionInputs(draft);

    console.log(draft);
  } catch (error) {
    console.error(error);
  }
};
