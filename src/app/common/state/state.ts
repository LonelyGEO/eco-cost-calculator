import { current, original } from 'immer';
import { Profession, Recipe, recipes } from '../../../data/recipes';
import { Profile } from '../../layout/content';
import { processAddRecipeFromInputAction } from './state-actions/add-recipe.action';
import { importProfileAction } from './state-actions/import-profile.action';
import { processRemoveRecipeAction } from './state-actions/remove-recipe.action';
import { updateRecipeSettingsAction } from './state-actions/set-recipe-settings.action';
import { updateCalorieCostAction } from './state-actions/update-calorie-cost.action';
import { updateCraftingStationAction } from './state-actions/update-crafting-station.action';
import { updateDataJsonAction } from './state-actions/update-data-json.action';
import { updateMarginAction } from './state-actions/update-margin.action';
import { updateProfessionAction } from './state-actions/update-profession-level.action';
import { switchProductRecipeAction } from './state-actions/switch-product-recipe.action';
import {
  syncTagSelectionInputs,
  updateTagSelectionAction,
} from './state-actions/update-tag-selection.action';
import {
  markForUpdate,
  updateByproductPrice,
  updatePrice,
} from './update-prices';

export interface ProfessionState extends Profession {
  selectedTalents: Record<string, number>;
}

export type ItemMap = Map<string, Item>;
export type CraftingRecipeMap = Map<string, CraftingRecipe>;
export type CraftingStationMap = Map<string, CraftingStation>;
export type ProfessionMap = Map<string, ProfessionState>;
export type TagSelectionMode = 'cheapest' | 'mix';
export interface TagSelectionCandidate {
  name: string;
  ratio: number;
}
export interface TagSelection {
  mode: TagSelectionMode;
  candidates: TagSelectionCandidate[];
}
export interface AppState {
  name: string;
  id: number;
  calorieCost: number;
  margin: number;
  recipes: CraftingRecipeMap;
  inputs: ItemMap;
  products: ItemMap;
  byproducts: ItemMap;
  craftingStations: CraftingStationMap;
  professions: ProfessionMap;
  updating: Set<string>;
  updated: Set<string>;
  data: Recipe[];
  customRecipes: Map<string, Recipe>;
  tagSelections: Map<string, TagSelection>;
}

export interface Item {
  canBeProduced: boolean;
  highlighted: boolean;
  name: string;
  displayName: string;
  usedInRecipes: Set<string>;
  productOfRecipes: Set<string>;
  byproductOfRecipes: Set<string>;
  price: number;
}

export interface CraftingRecipe extends Recipe {
  price: number;
  highlighted: boolean;
  batchSize?: number;
  margin?: number;
  fixedCost?: number;
}
export interface CraftingStation {
  name: string;
  displayName: string;
  localizedName: string;
  profession: ProfessionState;
  moduleSlots: string[];
  pluginModules: string[];
  selectedModules: Record<string, string>;
  usedByRecipes: Set<string>;
}
export const LOCAL_STORAGE_KEY = 'eco-cost-calculator-state-v14';

export type ProfileMap = Map<number, AppState>;

export interface Profiles {
  activeProfile: number;
  profiles: ProfileMap;
  dispatch: React.Dispatch<Action>;
}

export const initialState: AppState = {
  id: Math.random(),
  name: '默认方案',
  calorieCost: 0,
  margin: 0,
  inputs: new Map(),
  products: new Map(),
  recipes: new Map(),
  byproducts: new Map(),
  craftingStations: new Map(),
  professions: new Map(),
  updating: new Set(),
  updated: new Set(),
  data: recipes,
  customRecipes: new Map(),
  tagSelections: new Map(),
};

export const standardProfiles: Profiles = {
  activeProfile: 0,
  profiles: new Map([[0, { ...initialState, id: 0 }]]),
  dispatch: (action: Action) => undefined,
};

export enum ActionType {
  ADD_RECIPE,
  ADD_RECIPE_FROM_INPUT,
  SWITCH_PRODUCT_RECIPE,
  UPLOAD_DATA_JSON,
  REMOVE_RECIPE,
  UPDATE_RECIPE_SETTINGS,
  UPDATE_ITEM_PRICE,
  UPDATE_TAG_SELECTION,
  UPDATE_BYPRODUCT_PRICE,
  UPDATE_CRAFTING_STATION_UPGRADE,
  UPSERT_CUSTOM_RECIPE,
  DELETE_CUSTOM_RECIPE,
  UPDATE_PROFESSION,
  UPDATE_CALORIE_COST,
  IMPORT_PROFILE,
  UPDATE_MARGIN,
  UPDATE_PROFILE_NAME,
  ADD_PROFILE,
  DELETE_ACTIVE_PROFILE,
  SET_ACTIVE_PROFILE,
}

interface AddRecipeAction {
  type: ActionType.ADD_RECIPE;
  addedRecipe: CraftingRecipe;
}
interface AddRecipeFromInputAction {
  type: ActionType.ADD_RECIPE_FROM_INPUT;
  input: Item;
}
interface SwitchProductRecipeAction {
  type: ActionType.SWITCH_PRODUCT_RECIPE;
  recipe: Recipe;
}

interface RemoveRecipeAction {
  type: ActionType.REMOVE_RECIPE;
  removedRecipe: CraftingRecipe;
}

interface UpdateRecipeMarginAction {
  type: ActionType.UPDATE_RECIPE_SETTINGS;
  updatedRecipe: {
    name: string;
    margin: number;
    batchSize: number;
    fixedCost?: number;
  };
}

interface UpdateItemPriceAction {
  type: ActionType.UPDATE_ITEM_PRICE;
  updatedItem: {
    name: string;
    price: number;
  };
}

interface UpdateTagSelectionAction {
  type: ActionType.UPDATE_TAG_SELECTION;
  tagName: string;
  selection: TagSelection | null;
}

interface ImportProfileAction {
  type: ActionType.IMPORT_PROFILE;
  profileString: string;
}

interface UpdateByproductPriceAction {
  type: ActionType.UPDATE_BYPRODUCT_PRICE;
  updatedItem: {
    name: string;
    price: number;
  };
}

interface UpdateCraftingStationAction {
  type: ActionType.UPDATE_CRAFTING_STATION_UPGRADE;
  updatedCraftingStation: CraftingStation;
}

interface UpsertCustomRecipeAction {
  type: ActionType.UPSERT_CUSTOM_RECIPE;
  recipe: Recipe;
}

interface DeleteCustomRecipeAction {
  type: ActionType.DELETE_CUSTOM_RECIPE;
  recipeName: string;
}

interface UpdateDataJsonAction {
  type: ActionType.UPLOAD_DATA_JSON;
  data: string;
}

interface UpdateProfessionLevelAction {
  type: ActionType.UPDATE_PROFESSION;
  updatedProfession: ProfessionState;
}
interface UpdateMarginAction {
  type: ActionType.UPDATE_MARGIN;
  newMargin: number;
}

interface UpdateCalorieCostAction {
  type: ActionType.UPDATE_CALORIE_COST;
  newCost: number;
}

interface SetActiveProfileAction {
  type: ActionType.SET_ACTIVE_PROFILE;
  activeProfileId: number;
}

interface AddProfileAction {
  type: ActionType.ADD_PROFILE;
  newProfile: Profile;
}

interface UpdateProfileNameAction {
  type: ActionType.UPDATE_PROFILE_NAME;
  newName: string;
}

interface DeleteActiveProfileAction {
  type: ActionType.DELETE_ACTIVE_PROFILE;
}

export type Action =
  | AddRecipeAction
  | AddRecipeFromInputAction
  | SwitchProductRecipeAction
  | RemoveRecipeAction
  | UpdateItemPriceAction
  | UpdateTagSelectionAction
  | UpdateByproductPriceAction
  | UpdateRecipeMarginAction
  | ImportProfileAction
  | UpdateMarginAction
  | UpdateDataJsonAction
  | UpdateProfessionLevelAction
  | UpdateCraftingStationAction
  | UpsertCustomRecipeAction
  | DeleteCustomRecipeAction
  | UpdateCalorieCostAction
  | AddProfileAction
  | DeleteActiveProfileAction
  | UpdateProfileNameAction
  | SetActiveProfileAction;

export function reducer(draft: Profiles, action: Action): void | Profiles {
  console.time('state update');

  // global state altering actions
  processGlobalAction(draft, action);

  // actions regarding a single profile
  const activeProfile = draft.profiles.get(draft.activeProfile);
  if (!activeProfile) return;
  try {
    processProfileAction(activeProfile, action);
  } catch (error) {
    console.error(error);
    console.warn({
      originalState: original(activeProfile),
      newState: current(activeProfile),
    });
  }

  activeProfile.updating = new Set();
  activeProfile.updated = new Set();

  const newState = serializeState(current(draft));
  localStorage.setItem(LOCAL_STORAGE_KEY, newState);
  console.timeEnd('state update');
}

function processGlobalAction(draft: Profiles, action: Action): void {
  switch (action.type) {
    case ActionType.SET_ACTIVE_PROFILE:
      draft.activeProfile = action.activeProfileId;
      return;
    case ActionType.ADD_PROFILE:
      const id = Math.random();
      draft.profiles.set(id, {
        ...initialState,
        ...action.newProfile,
        id,
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
      });
      return;
    case ActionType.DELETE_ACTIVE_PROFILE:
      draft.profiles.delete(draft.activeProfile);
      draft.activeProfile = Array.from(draft.profiles.keys())[0];
      return;
  }
}

function processProfileAction(draft: AppState, action: Action): void {
  switch (action.type) {
    case ActionType.ADD_RECIPE:
      return switchProductRecipeAction({
        draft,
        recipe: action.addedRecipe,
      });
    case ActionType.ADD_RECIPE_FROM_INPUT:
      return processAddRecipeFromInputAction({
        draft,
        input: action.input,
      });
    case ActionType.SWITCH_PRODUCT_RECIPE:
      return switchProductRecipeAction({ draft, recipe: action.recipe });
    case ActionType.REMOVE_RECIPE:
      return processRemoveRecipeAction({
        draft,
        removedRecipe: action.removedRecipe,
      });
    case ActionType.UPDATE_ITEM_PRICE:
      return processItemPriceUpdate({ draft, updatedItem: action.updatedItem });
    case ActionType.UPDATE_TAG_SELECTION:
      return updateTagSelectionAction({
        draft,
        tagName: action.tagName,
        selection: action.selection,
      });
    case ActionType.UPDATE_BYPRODUCT_PRICE:
      return processByproductPriceUpdate({
        draft,
        updatedItem: action.updatedItem,
      });
    case ActionType.UPDATE_PROFESSION:
      return updateProfessionAction({
        draft,
        updatedProfession: action.updatedProfession,
      });
    case ActionType.UPDATE_MARGIN:
      return updateMarginAction({ draft, newMargin: action.newMargin });
    case ActionType.UPDATE_CALORIE_COST:
      return updateCalorieCostAction({ draft, newCost: action.newCost });
    case ActionType.UPDATE_CRAFTING_STATION_UPGRADE:
      return updateCraftingStationAction({
        draft,
        updatedCraftingStation: action.updatedCraftingStation,
      });
    case ActionType.UPSERT_CUSTOM_RECIPE:
      draft.customRecipes.set(action.recipe.name, action.recipe);
      resetRecipeData(draft);
      return;
    case ActionType.DELETE_CUSTOM_RECIPE:
      draft.customRecipes.delete(action.recipeName);
      resetRecipeData(draft);
      return;
    case ActionType.UPLOAD_DATA_JSON:
      return updateDataJsonAction({ draft, data: action.data });
    case ActionType.IMPORT_PROFILE:
      console.log(action.profileString);
      return importProfileAction({
        draft,
        profileString: action.profileString,
      });
    case ActionType.UPDATE_RECIPE_SETTINGS:
      return updateRecipeSettingsAction({
        draft,
        updatedRecipe: action.updatedRecipe,
      });
    case ActionType.UPDATE_PROFILE_NAME:
      draft.name = action.newName;
      return;
    default:
      return;
  }
}
export interface ProcessActionProps {
  draft: AppState;
}

interface ProcessItemPriceUpdateProps {
  draft: AppState;
  updatedItem: { name: string; price: number };
}
function processItemPriceUpdate({
  draft,
  updatedItem,
}: ProcessItemPriceUpdateProps) {
  const properItem = draft.inputs.get(updatedItem.name);
  if (!properItem) return;
  properItem.price = updatedItem.price;

  markForUpdate({ draft, element: properItem });
  return updatePrice({
    draft,
    element: properItem,
  });
}

function processByproductPriceUpdate({
  draft,
  updatedItem,
}: ProcessItemPriceUpdateProps) {
  const properItem = draft.byproducts.get(updatedItem.name);
  if (!properItem) return;
  properItem.price = updatedItem.price;

  return updateByproductPrice({
    draft,
    item: properItem,
  });
}

export function replacer(key: string, value: unknown): unknown {
  if (key === 'data') return undefined;
  if (!value) return value;
  if (value instanceof Map) {
    return {
      _type: 'map',
      map: [...value],
    };
  }
  if (value instanceof Set) {
    return {
      _type: 'set',
      set: [...value],
    };
  }

  return value;
}

export function reviver(_: string, value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  const typedValue = value as {
    _type?: string;
    map?: [unknown, unknown][];
    set?: unknown[];
  };
  if (typedValue._type === 'map') return new Map(typedValue.map ?? []);
  if (typedValue._type === 'set') return new Set(typedValue.set ?? []);
  else return value;
}

export function serializeState(state: Profiles): string {
  return JSON.stringify(state, replacer);
}

export function deserializeState(serialized: string): Profiles {
  const state: Profiles = JSON.parse(serialized, reviver);

  state.profiles.forEach((profile) => {
    if (profile.name === 'Default') profile.name = '默认方案';
    profile.customRecipes = profile.customRecipes ?? new Map();
    profile.tagSelections = profile.tagSelections ?? new Map();
    profile.data = mergeRecipeData(profile.customRecipes);
    profile.professions.forEach((profession) => {
      profession.selectedTalents = profession.selectedTalents ?? {};
    });
    profile.craftingStations.forEach((station) => {
      station.selectedModules = station.selectedModules ?? {};
    });
    syncTagSelectionInputs(profile);
  });

  return state;
}

export function migrateLegacyState(serialized: string): Profiles {
  try {
    const legacy = JSON.parse(serialized, reviver) as Partial<Profiles>;
    if (!(legacy.profiles instanceof Map) || legacy.profiles.size === 0) {
      return standardProfiles;
    }

    const migratedProfiles = new Map<number, AppState>();
    legacy.profiles.forEach((legacyProfile, id) => {
      migratedProfiles.set(id, {
        ...initialState,
        id,
        name:
          legacyProfile.name === 'Default' ? '默认方案' : legacyProfile.name,
        calorieCost: legacyProfile.calorieCost ?? 0,
        margin: legacyProfile.margin ?? 0,
        recipes: new Map(),
        inputs: new Map(),
        products: new Map(),
        byproducts: new Map(),
        craftingStations: new Map(),
        professions: new Map(),
        updating: new Set(),
        updated: new Set(),
        customRecipes: new Map(),
        tagSelections: new Map(),
        data: recipes,
      });
    });

    const activeProfile = migratedProfiles.has(legacy.activeProfile ?? -1)
      ? (legacy.activeProfile as number)
      : Array.from(migratedProfiles.keys())[0];

    return {
      activeProfile,
      profiles: migratedProfiles,
      dispatch: standardProfiles.dispatch,
    };
  } catch {
    return standardProfiles;
  }
}

export function mergeRecipeData(customRecipes: Map<string, Recipe>): Recipe[] {
  const merged = new Map(recipes.map((recipe) => [recipe.name, recipe]));
  customRecipes.forEach((recipe, name) => merged.set(name, recipe));
  return Array.from(merged.values());
}

export function resetRecipeData(draft: AppState): void {
  draft.data = mergeRecipeData(draft.customRecipes);
  draft.craftingStations = new Map();
  draft.professions = new Map();
  draft.recipes = new Map();
  draft.inputs = new Map();
  draft.products = new Map();
  draft.byproducts = new Map();
  draft.updating = new Set();
  draft.updated = new Set();
  syncTagSelectionInputs(draft);
}
