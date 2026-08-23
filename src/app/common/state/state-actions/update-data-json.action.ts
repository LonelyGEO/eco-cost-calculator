import { recipesFromJson } from '../../../../data/recipes';
import { ProcessActionProps, resetRecipeData } from '../state';

interface UpdateDataJsonActionProps extends ProcessActionProps {
  data: string;
}

export const updateDataJsonAction = ({
  draft,
  data,
}: UpdateDataJsonActionProps) => {
  try {
    const json = JSON.parse(data);

    const recipes = recipesFromJson(json);

    draft.customRecipes = new Map(
      recipes.map((recipe) => [recipe.name, recipe]),
    );
    resetRecipeData(draft);
  } catch (error) {
    console.error(error);
  }
};
