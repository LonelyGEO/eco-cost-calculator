import ClearIcon from '@mui/icons-material/Clear';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { Recipe } from '../../data/recipes';
import {
  Action,
  CraftingRecipeMap,
  ItemMap,
  Item,
  ActionType,
  CraftingRecipe,
} from '../common/state/state';
import { getRecipeOrThrow } from '../common/state/state-getters';
import { PriceDisplay } from './price-display';
import { RecipeAutocomplete } from './recipe.autocomplete';
import SettingsIcon from '@mui/icons-material/Settings';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import React from 'react';
import { FlexItem } from '../common/flex-grid-item';
import { NumberInput } from '../common/number-input';
import { localizeGameText } from '../../data/localization';

interface ProductProps {
  dispatch: React.Dispatch<Action>;
  products: ItemMap;
  recipes: CraftingRecipeMap;
  data: Recipe[];
}
export const Product: React.FC<ProductProps> = ({
  dispatch,
  products,
  recipes,
  data,
}) => {
  const productRows = buildProductTree(products, recipes);
  return (
    <Stack>
      <RecipeAutocomplete
        dispatch={dispatch}
        selectedRecipes={recipes}
        data={data}
      />
      {productRows.map(({ product, depth }) => (
        <ProductRow
          key={product.name}
          dispatch={dispatch}
          recipes={recipes}
          product={product}
          data={data}
          depth={depth}
        />
      ))}
    </Stack>
  );
};

export interface ProductTreeRow {
  product: Item;
  depth: number;
}

export function buildProductTree(
  products: ItemMap,
  recipes: CraftingRecipeMap,
): ProductTreeRow[] {
  const productList = Array.from(products.values());
  const productNames = new Set(productList.map(({ name }) => name));
  const childrenByParent = new Map<string, Set<string>>();
  const childNames = new Set<string>();

  productList.forEach((product) => {
    product.usedInRecipes.forEach((recipeName) => {
      const parentRecipe = recipes.get(recipeName);
      const parentName = parentRecipe?.mainProduct.name;
      if (
        !parentName ||
        parentName === product.name ||
        !productNames.has(parentName)
      )
        return;
      const children = childrenByParent.get(parentName) ?? new Set<string>();
      children.add(product.name);
      childrenByParent.set(parentName, children);
      childNames.add(product.name);
    });
  });

  const result: ProductTreeRow[] = [];
  const visited = new Set<string>();
  const visit = (product: Item, depth: number) => {
    if (visited.has(product.name)) return;
    visited.add(product.name);
    result.push({ product, depth });
    const children = childrenByParent.get(product.name) ?? new Set<string>();
    productList
      .filter((candidate) => children.has(candidate.name))
      .forEach((child) => visit(child, depth + 1));
  };

  productList
    .filter((product) => !childNames.has(product.name))
    .forEach((product) => visit(product, 0));
  productList.forEach((product) => visit(product, 0));
  return result;
}

interface ProductRowProps {
  dispatch: React.Dispatch<Action>;
  product: Item;
  recipes: CraftingRecipeMap;
  data: Recipe[];
  depth: number;
}

const ProductRow: React.FC<ProductRowProps> = ({
  dispatch,
  recipes,
  product,
  data,
  depth,
}) => {
  const itemRecipes = Array.from(product.productOfRecipes)
    .map((recipeName) => getRecipeOrThrow(recipes, recipeName))
    .filter((recipe) => {
      return recipe.mainProduct.name === product.name;
    });
  const primaryRecipe = itemRecipes[0];
  const availableRecipes = data.filter(
    (recipe) => recipe.mainProduct.name === product.name,
  );

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        minWidth: 0,
        pl: Math.min(depth, 4) * 2,
      }}
    >
      <IconButton
        aria-label={`移除${localizeGameText(product.displayName)}`}
        onClick={() => {
          itemRecipes.forEach((recipe) => {
            dispatch({
              type: ActionType.REMOVE_RECIPE,
              removedRecipe: recipe,
            });
          });
        }}
      >
        <ClearIcon />
      </IconButton>
      {depth > 0 && (
        <Typography
          component="span"
          color="text.secondary"
          aria-label={`次级产品，第 ${depth} 层`}
          sx={{ mr: 0.75, fontFamily: 'monospace', flexShrink: 0 }}
        >
          └─
        </Typography>
      )}
      <Typography component="span" noWrap sx={{ minWidth: 0, flex: 1 }}>
        {localizeGameText(product.displayName)}
      </Typography>
      <Stack direction="row" alignItems="center" sx={{ flexShrink: 0, pr: 1 }}>
        <PriceDisplay price={product.price} />
        <RecipeRouteSelector
          dispatch={dispatch}
          product={product}
          currentRecipe={primaryRecipe}
          availableRecipes={availableRecipes}
        />
        {primaryRecipe && (
          <RecipeSettings
            key={primaryRecipe.name}
            dispatch={dispatch}
            recipe={primaryRecipe}
          />
        )}
      </Stack>
    </Box>
  );
};

interface RecipeRouteSelectorProps {
  dispatch: React.Dispatch<Action>;
  product: Item;
  currentRecipe?: CraftingRecipe;
  availableRecipes: Recipe[];
}

const RecipeRouteSelector: React.FC<RecipeRouteSelectorProps> = ({
  dispatch,
  product,
  currentRecipe,
  availableRecipes,
}) => {
  const [open, setOpen] = React.useState(false);
  if (availableRecipes.length < 2) return null;

  return (
    <>
      <Tooltip title={`切换生产配方（共 ${availableRecipes.length} 条）`}>
        <IconButton
          size="small"
          aria-label={`切换${localizeGameText(product.displayName)}的生产配方`}
          onClick={() => setOpen(true)}
        >
          <SwapHorizIcon />
        </IconButton>
      </Tooltip>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          选择“{localizeGameText(product.displayName)}”的生产配方
        </DialogTitle>
        <DialogContent>
          <List sx={{ pt: 1 }}>
            {availableRecipes.map((recipe) => {
              const selected = recipe.name === currentRecipe?.name;
              const ingredientSummary = recipe.ingredients
                .map(
                  (ingredient) =>
                    `${ingredient.localizedName || ingredient.displayName} × ${
                      ingredient.quantity
                    }`,
                )
                .join('、');
              return (
                <ListItemButton
                  key={recipe.name}
                  selected={selected}
                  onClick={() => {
                    dispatch({
                      type: ActionType.SWITCH_PRODUCT_RECIPE,
                      recipe,
                    });
                    setOpen(false);
                  }}
                  sx={{ borderRadius: 1, mb: 1 }}
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight={700}>
                          {recipe.localizedName || recipe.displayName}
                        </Typography>
                        {selected && <Chip size="small" label="当前使用" />}
                      </Stack>
                    }
                    secondary={`${recipe.tableLocalizedName} · ${
                      recipe.professions[0].localizedName ||
                      recipe.professions[0].displayName
                    } · ${ingredientSummary}`}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>取消</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

interface RecipeSettingsProps {
  dispatch: React.Dispatch<Action>;
  recipe: CraftingRecipe;
}
const RecipeSettings: React.FC<RecipeSettingsProps> = ({
  dispatch,
  recipe: primaryRecipe,
}) => {
  const [batchSize, setBatchSize] = React.useState(
    primaryRecipe?.batchSize || 0,
  );
  const [margin, setMargin] = React.useState(
    (primaryRecipe?.margin || 0) * 100,
  );
  const [fixedCost, setFixedCost] = React.useState(
    primaryRecipe?.fixedCost || 0,
  );

  const [isDialogVisible, setIsDialogVisible] = React.useState(false);

  const isOriginal = React.useMemo(
    () => batchSize === 0 && margin === 0 && fixedCost === 0,
    [batchSize, margin, fixedCost],
  );
  return (
    <>
      <IconButton
        aria-label={`配置配方${localizeGameText(primaryRecipe.name)}`}
        size="small"
        onClick={() => setIsDialogVisible(true)}
      >
        <SettingsIcon color={isOriginal ? undefined : 'primary'} />
      </IconButton>
      <Dialog open={isDialogVisible} onClose={() => setIsDialogVisible(false)}>
        <DialogTitle>
          配方设置：{primaryRecipe.localizedName || primaryRecipe.displayName}
        </DialogTitle>
        <DialogContent>
          <Stack>
            <FlexItem>
              <Typography component="span">利润率</Typography>
              <NumberInput
                value={margin}
                onChange={(event) => {
                  const parsed = parseFloat(event.target.value);
                  setMargin(isNaN(parsed) ? margin : parsed);
                }}
                sx={{ width: 140, paddingLeft: 4 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">%</InputAdornment>
                  ),
                }}
              />
            </FlexItem>
            <FlexItem>
              <Typography component="span">批量数量</Typography>
              <NumberInput
                value={batchSize}
                onChange={(event) => {
                  const parsed = parseInt(event.target.value, 10);
                  setBatchSize(isNaN(parsed) ? batchSize : parsed);
                }}
                sx={{ width: 140, paddingLeft: 4 }}
              />
            </FlexItem>
            <FlexItem>
              <Typography component="span">固定成本</Typography>
              <NumberInput
                value={fixedCost}
                onChange={(event) => {
                  const parsed = parseInt(event.target.value, 10);
                  setFixedCost(isNaN(parsed) ? fixedCost : parsed);
                }}
                sx={{ width: 140, paddingLeft: 4 }}
              />
            </FlexItem>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setIsDialogVisible(false);
              setBatchSize(primaryRecipe?.batchSize || 0);
              setMargin(primaryRecipe?.margin || 0);
            }}
          >
            取消
          </Button>
          <Button
            onClick={() => {
              dispatch({
                type: ActionType.UPDATE_RECIPE_SETTINGS,
                updatedRecipe: {
                  name: primaryRecipe.name,
                  fixedCost,
                  batchSize,
                  margin: margin / 100,
                },
              });
              setIsDialogVisible(false);
            }}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
