import { recipes } from '../../data/recipes';
import { filterRecipeOptions } from './recipe.autocomplete';

describe('recipe search', () => {
  it('matches ordinary Chinese keywords only against visible product names', () => {
    const results = filterRecipeOptions(recipes, { inputValue: '机械' });

    expect(results.length).toBeGreaterThan(0);
    expect(results.some((recipe) => recipe.name === 'BoilerRecipe')).toBe(
      false,
    );
    expect(
      results.every(
        (recipe) =>
          recipe.localizedName.includes('机械') ||
          recipe.displayName.toLocaleLowerCase().includes('机械'),
      ),
    ).toBe(true);
  });

  it('supports English names and prioritizes an exact name', () => {
    const results = filterRecipeOptions(recipes, { inputValue: 'Boiler' });

    expect(results[0]?.name).toBe('BoilerRecipe');
  });

  it('requires an explicit prefix to search by crafting station', () => {
    const results = filterRecipeOptions(recipes, {
      inputValue: '制作站:机械师工作台',
    });

    expect(results.some((recipe) => recipe.name === 'BoilerRecipe')).toBe(true);
    expect(
      results.every(
        (recipe) =>
          recipe.tableLocalizedName.includes('机械师工作台') ||
          recipe.tableDisplayName.toLocaleLowerCase().includes('机械师工作台'),
      ),
    ).toBe(true);
  });

  it('does not expose internal IDs unless id search is requested', () => {
    expect(
      filterRecipeOptions(recipes, { inputValue: 'BoilerRecipe' }),
    ).toHaveLength(0);
    expect(
      filterRecipeOptions(recipes, { inputValue: 'id:BoilerRecipe' })[0]?.name,
    ).toBe('BoilerRecipe');
  });
});
