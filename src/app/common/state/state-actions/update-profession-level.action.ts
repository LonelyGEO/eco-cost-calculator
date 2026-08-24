import { CraftingRecipe, ProcessActionProps, ProfessionState } from '../state';
import { markForUpdate, updatePrice } from '../update-prices';
import { getLumberRidgeTalentsForSkill } from '../../../../data/lumber-ridge';

interface UpdateProfessionLevelProps extends ProcessActionProps {
  updatedProfession: ProfessionState;
}

export const updateProfessionAction = ({
  draft,
  updatedProfession,
}: UpdateProfessionLevelProps) => {
  const profession = draft.professions.get(updatedProfession.name);
  if (!profession) return;

  profession.level = updatedProfession.level;
  profession.selectedTalents = Object.fromEntries(
    Object.entries(updatedProfession.selectedTalents).filter(([groupName]) => {
      const talent = profession.talents.find(
        (candidate) => candidate.groupName === groupName,
      );
      return talent && updatedProfession.level >= talent.unlockLevel;
    }),
  );
  const lumberRidgeTalents = getLumberRidgeTalentsForSkill(profession.name);
  profession.selectedLumberRidgeTalents = Object.fromEntries(
    Object.entries(updatedProfession.selectedLumberRidgeTalents ?? {}).filter(
      ([groupName]) => {
        const talent = lumberRidgeTalents.find(
          (candidate) => candidate.groupName === groupName,
        );
        return talent && updatedProfession.level >= talent.unlockLevel;
      },
    ),
  );

  draft.recipes.forEach((recipe) => {
    if (
      !draft.lumberRidgeEnabled &&
      !recipeMatchesProfession(recipe, profession)
    )
      return;

    markForUpdate({ draft, element: recipe });
  });
  draft.recipes.forEach((recipe) => {
    if (
      !draft.lumberRidgeEnabled &&
      !recipeMatchesProfession(recipe, profession)
    )
      return;

    updatePrice({ draft, element: recipe });
  });
  return;
};

function recipeMatchesProfession(
  recipe: CraftingRecipe,
  profession: ProfessionState,
) {
  return recipe.professions.some(
    (recipeProfession) => recipeProfession.name === profession.name,
  );
}
