import rawEcoData from './eco-data.json';

export type BonusAction = 'ResourceCost' | 'LaborCost' | 'CraftTime' | 'Yield';

export type BonusEffectType =
  | 'Additive'
  | 'AdditivePercent'
  | 'CappedMultiplicative'
  | 'Multiplicative';

export interface Bonus {
  action: BonusAction;
  effectType: BonusEffectType;
  value: number;
  cap?: number;
  skillTypes?: string[];
  excludedSkillTypes?: string[];
  itemTags?: string[];
  recipeNames?: string[];
  craftingStationTypes?: string[];
}

export interface Modifier {
  dynamicType: 'Talent' | 'Skill' | 'Module' | 'Layer' | string;
  item?: string;
  valueType?: string;
}

export interface Talent {
  name: string;
  groupName: string;
  displayName: string;
  localizedName: string;
  description: string;
  unlockLevel: number;
  maxLevel: number;
  bonuses: Bonus[];
}

export interface Profession {
  name: string;
  displayName: string;
  localizedName: string;
  level: number;
  maxLevel: number;
  laborReducePercent: number[];
  talents: Talent[];
}

export interface BaselineItem {
  quantity: number;
  modifiers: Modifier[];
  isConstant: boolean;
  displayName: string;
  localizedName: string;
}

export interface Product extends BaselineItem {
  name: string;
  itemTags: string[];
  isRefund: boolean;
}

export interface TagIngredient extends BaselineItem {
  name: null;
  tag: string;
}

export interface ItemIngredient extends BaselineItem {
  name: string;
  tag: null;
}

export type Ingredient = ItemIngredient | TagIngredient;

export interface Recipe {
  name: string;
  displayName: string;
  localizedName: string;
  familyName: string;
  isBlueprint: boolean;
  isDefault: boolean;
  ingredients: Ingredient[];
  products: Product[];
  mainProduct: Product;
  byproducts: Product[];
  calories: number;
  laborModifiers: Modifier[];
  craftMinutes: number;
  craftMinuteModifiers: Modifier[];
  experience: number;
  table: string;
  tableDisplayName: string;
  tableLocalizedName: string;
  professions: Profession[];
}

export interface ModuleDefinition {
  name: string;
  displayName: string;
  localizedName: string;
  slot: string;
  bonuses: Bonus[];
}

export interface CraftingTableDefinition {
  name: string;
  displayName: string;
  localizedName: string;
  moduleSlots: string[];
  pluginModules: string[];
}

export interface ItemDefinition {
  name: string;
  displayName: string;
  localizedName: string;
}

export interface TagDefinition extends ItemDefinition {
  associatedItems: string[];
}

export interface EcoDataMetadata {
  gameVersion: string;
  schemaVersion: number;
  upstreamSchemaVersion: number;
  sourceRepository: string;
  sourcePath: string;
  sourceCommit: string;
  sourceCommitDate: string;
  generatedAt: string;
  recipeCount: number;
  itemCount: number;
  skillCount: number;
  talentCount: number;
  moduleCount: number;
}

interface RawRecipeItem {
  name: string | null;
  tag: string | null;
  displayName: string;
  localizedName: string;
  quantity: { baseValue: number; modifiers: Modifier[] };
}

interface RawProduct extends RawRecipeItem {
  name: string;
  tag: null;
  itemTags: string[];
  isRefund: boolean;
}

interface RawRecipe {
  name: string;
  displayName: string;
  localizedName: string;
  familyName: string;
  isBlueprint: boolean;
  isDefault: boolean;
  craftingTable: string;
  tableDisplayName: string;
  tableLocalizedName: string;
  requiredSkill: string;
  skillDisplayName: string;
  skillLocalizedName: string;
  requiredSkillLevel: number;
  labor: { baseValue: number; modifiers: Modifier[] };
  craftMinutes: { baseValue: number; modifiers: Modifier[] };
  ingredients: RawRecipeItem[];
  products: RawProduct[];
}

interface RawEcoData {
  metadata: EcoDataMetadata;
  skills: Omit<Profession, 'level'>[];
  modules: ModuleDefinition[];
  craftingTables: CraftingTableDefinition[];
  items: ItemDefinition[];
  tags: TagDefinition[];
  recipes: RawRecipe[];
}

const ecoData = rawEcoData as unknown as RawEcoData;
const skillsByName = new Map(
  ecoData.skills.map((skill) => [skill.name, skill]),
);

function createBaselineItem(item: RawRecipeItem): BaselineItem {
  return {
    quantity: item.quantity.baseValue,
    modifiers: item.quantity.modifiers,
    isConstant: item.quantity.modifiers.length === 0,
    displayName: item.displayName,
    localizedName: item.localizedName,
  };
}

function createRecipe(recipe: RawRecipe): Recipe {
  const products: Product[] = recipe.products.map((product) => ({
    ...createBaselineItem(product),
    name: product.name,
    itemTags: product.itemTags,
    isRefund: product.isRefund,
  }));
  const mainProduct =
    products.find((product) => !product.isRefund) ?? products[0];
  const skill = skillsByName.get(recipe.requiredSkill);
  const profession: Profession = {
    name: recipe.requiredSkill || 'GeneralSkill',
    displayName: recipe.skillDisplayName || 'General',
    localizedName: recipe.skillLocalizedName || '通用',
    level: recipe.requiredSkillLevel,
    maxLevel: skill?.maxLevel ?? 0,
    laborReducePercent: skill?.laborReducePercent ?? [1],
    talents: skill?.talents ?? [],
  };

  return {
    name: recipe.name,
    displayName: recipe.displayName,
    localizedName: recipe.localizedName,
    familyName: recipe.familyName,
    isBlueprint: recipe.isBlueprint,
    isDefault: recipe.isDefault,
    ingredients: recipe.ingredients.map((ingredient) => ({
      ...createBaselineItem(ingredient),
      name: ingredient.name,
      tag: ingredient.tag,
    })) as Ingredient[],
    products,
    mainProduct,
    byproducts: products.filter((product) => product !== mainProduct),
    calories: recipe.labor.baseValue,
    laborModifiers: recipe.labor.modifiers,
    craftMinutes: recipe.craftMinutes.baseValue,
    craftMinuteModifiers: recipe.craftMinutes.modifiers,
    experience: 0,
    table: recipe.craftingTable,
    tableDisplayName: recipe.tableDisplayName,
    tableLocalizedName: recipe.tableLocalizedName,
    professions: [profession],
  };
}

export const recipes: Recipe[] = ecoData.recipes.map(createRecipe);
export const skillDefinitions: Profession[] = ecoData.skills.map((skill) => ({
  ...skill,
  level: 0,
}));
export const modules: ModuleDefinition[] = ecoData.modules;
export const craftingTables: CraftingTableDefinition[] = ecoData.craftingTables;
export const items: ItemDefinition[] = ecoData.items;
export const tags: TagDefinition[] = ecoData.tags;
export const dataMetadata: EcoDataMetadata = ecoData.metadata;

export const modulesByName = new Map(
  modules.map((module) => [module.name, module]),
);
export const craftingTablesByName = new Map(
  craftingTables.map((table) => [table.name, table]),
);
export const itemsByName = new Map(items.map((item) => [item.name, item]));
export const tagsByName = new Map(tags.map((tag) => [tag.name, tag]));

/** Compatibility adapter for the original calculator's JSON export format. */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function recipesFromJson(json: unknown): Recipe[] {
  if (!Array.isArray(json)) throw new Error('配方数据必须是数组。');

  return json.map((value, index) => {
    const recipe = value as Record<string, any>;
    if (!Array.isArray(recipe.ingredients) || !Array.isArray(recipe.products)) {
      throw new Error(`第 ${index + 1} 条配方缺少原料或产品。`);
    }

    const products: Product[] = recipe.products.map((product: any) => ({
      name: String(product.name),
      displayName: String(product.displayName ?? product.name),
      localizedName: String(
        product.localizedName ?? product.displayName ?? product.name,
      ),
      quantity: Number(product.quantity ?? 0),
      modifiers:
        product.modifiers ??
        (product.isConstant ? [] : [{ dynamicType: 'Module' }]),
      isConstant: Boolean(product.isConstant),
      itemTags: product.itemTags ?? [],
      isRefund: Boolean(product.isRefund),
    }));
    const mainProduct = products[0];
    const profession = recipe.professions?.[0] ?? {
      name: 'GeneralSkill',
      displayName: 'General',
      localizedName: '通用',
      level: 0,
      maxLevel: 0,
      laborReducePercent: [1],
      talents: [],
    };

    return {
      name: String(recipe.name),
      displayName: String(recipe.displayName ?? recipe.name),
      localizedName: String(
        recipe.localizedName ?? recipe.displayName ?? recipe.name,
      ),
      familyName: String(recipe.familyName ?? recipe.name),
      isBlueprint: Boolean(recipe.isBlueprint),
      isDefault: recipe.isDefault !== false,
      ingredients: recipe.ingredients.map((ingredient: any) => ({
        name: ingredient.name ?? null,
        tag: ingredient.tag ?? null,
        displayName: String(
          ingredient.displayName ?? ingredient.name ?? ingredient.tag,
        ),
        localizedName: String(
          ingredient.localizedName ??
            ingredient.displayName ??
            ingredient.name ??
            ingredient.tag,
        ),
        quantity: Number(ingredient.quantity ?? 0),
        modifiers:
          ingredient.modifiers ??
          (ingredient.isConstant
            ? []
            : [{ dynamicType: 'Module', valueType: 'Efficiency' }]),
        isConstant: Boolean(ingredient.isConstant),
      })) as Ingredient[],
      products,
      mainProduct,
      byproducts: products.slice(1),
      calories: Number(recipe.calories ?? 0),
      laborModifiers: recipe.laborModifiers ?? [{ dynamicType: 'Skill' }],
      craftMinutes: Number(recipe.craftMinutes ?? recipe.time ?? 0),
      craftMinuteModifiers: recipe.craftMinuteModifiers ?? [],
      experience: Number(recipe.experience ?? 0),
      table: String(recipe.table ?? 'CustomCraftingTableItem'),
      tableDisplayName: String(
        recipe.tableDisplayName ?? recipe.table ?? '自定义制作站',
      ),
      tableLocalizedName: String(
        recipe.tableLocalizedName ??
          recipe.tableDisplayName ??
          recipe.table ??
          '自定义制作站',
      ),
      professions: [profession],
    };
  });
}
/* eslint-enable @typescript-eslint/no-explicit-any */
