import {
  craftingTables,
  dataMetadata,
  items,
  modules,
  recipes,
  skillDefinitions,
  tags,
  tagsByName,
} from './recipes';

describe('ECO 14 data', () => {
  it('uses the complete vanilla 14.0.3 snapshot', () => {
    expect(dataMetadata.gameVersion).toBe('14.0.3');
    expect(recipes).toHaveLength(1485);
    expect(dataMetadata.itemCount).toBe(1593);
    expect(dataMetadata.talentCount).toBe(138);
  });

  it('contains the current Asphalt Concrete balance values', () => {
    const asphalt = recipes.find(
      (recipe) => recipe.name === 'AsphaltConcreteRecipe',
    );
    const crushedRock = asphalt?.ingredients.find(
      (ingredient) => ingredient.tag === 'CrushedRock',
    );

    expect(asphalt?.localizedName).toBe('沥青混凝土');
    expect(crushedRock?.quantity).toBe(10);
    expect(asphalt?.mainProduct.quantity).toBe(2);
  });

  it('keeps every output instead of dropping additional byproducts', () => {
    const bison = recipes.find(
      (recipe) => recipe.name === 'ButcherBisonRecipe',
    );

    expect(bison?.products).toHaveLength(3);
    expect(bison?.byproducts).toHaveLength(2);
  });

  it('contains the concrete members of vanilla ingredient tags', () => {
    expect(tagsByName.get('Fabric')?.associatedItems).toEqual([
      'CottonFabricItem',
      'LinenFabricItem',
      'NylonFabricItem',
      'WoolFabricItem',
    ]);
  });

  it('has Chinese names for every visible Update 14 data entry', () => {
    const ingredientTagNames = new Set(
      recipes.flatMap((recipe) =>
        recipe.ingredients.flatMap((ingredient) =>
          ingredient.tag ? [ingredient.tag] : [],
        ),
      ),
    );
    const visibleTags = tags.filter((tag) => ingredientTagNames.has(tag.name));
    const visibleTagItemNames = new Set(
      visibleTags.flatMap((tag) => tag.associatedItems),
    );
    const visibleNames = [
      ...recipes.flatMap((recipe) => [
        [recipe.displayName, recipe.localizedName],
        [recipe.tableDisplayName, recipe.tableLocalizedName],
        ...recipe.ingredients.map((item) => [
          item.displayName,
          item.localizedName,
        ]),
        ...recipe.products.map((item) => [
          item.displayName,
          item.localizedName,
        ]),
      ]),
      ...skillDefinitions.flatMap((skill) => [
        [skill.displayName, skill.localizedName],
        ...skill.talents.map((talent) => [
          talent.displayName,
          talent.localizedName,
        ]),
      ]),
      ...modules.map((module) => [module.displayName, module.localizedName]),
      ...craftingTables.map((table) => [
        table.displayName,
        table.localizedName,
      ]),
      ...visibleTags.map((tag) => [tag.displayName, tag.localizedName]),
      ...items
        .filter((item) => visibleTagItemNames.has(item.name))
        .map((item) => [item.displayName, item.localizedName]),
    ];

    expect(
      visibleNames.filter(([english, chinese]) => english === chinese),
    ).toHaveLength(0);
  });
});
