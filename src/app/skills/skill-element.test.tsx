import { fireEvent, render, waitFor } from '@testing-library/react';
import { recipes } from '../../data/recipes';
import { AppState, initialState } from '../common/state/state';
import { processAddRecipeAction } from '../common/state/state-actions/add-recipe.action';
import { SkillSegment } from './skill-element';

it('collapses and expands a profession panel', async () => {
  const state: AppState = {
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
  const recipe = recipes.find(
    (candidate) => candidate.name === 'AsphaltConcreteRecipe',
  )!;
  processAddRecipeAction({
    draft: state,
    addedRecipe: { ...recipe, price: 0, highlighted: false },
  });

  const profession = Array.from(state.professions.values())[0];
  const station = Array.from(state.craftingStations.values())[0];
  const professionName = profession.localizedName || profession.displayName;
  const stationName = station.localizedName || station.displayName;
  const { getByLabelText, getByText, queryByText } = render(
    <SkillSegment
      dispatch={jest.fn()}
      professions={state.professions}
      craftingStations={state.craftingStations}
    />,
  );

  expect(getByText(stationName)).toBeInTheDocument();
  fireEvent.click(getByLabelText(`折叠${professionName}`));
  await waitFor(() => expect(queryByText(stationName)).not.toBeInTheDocument());
  fireEvent.click(getByLabelText(`展开${professionName}`));
  await waitFor(() => expect(getByText(stationName)).toBeInTheDocument());
});
