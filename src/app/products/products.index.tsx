import ClearIcon from '@mui/icons-material/Clear';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
import { formatEstimatedQuantity } from '../common/state/get-bill-of-materials';

interface ProductProps {
  dispatch: React.Dispatch<Action>;
  products: ItemMap;
  recipes: CraftingRecipeMap;
  data: Recipe[];
  estimatedQuantities: Map<string, number>;
  rootProducts: Set<string>;
}
export const Product: React.FC<ProductProps> = ({
  dispatch,
  products,
  recipes,
  data,
  estimatedQuantities,
  rootProducts,
}) => {
  const productForest = buildProductForest(products, recipes);
  const [collapsedProducts, setCollapsedProducts] = React.useState<Set<string>>(
    () => new Set(),
  );

  const toggleProduct = (productName: string) => {
    setCollapsedProducts((current) => {
      const next = new Set(current);
      if (next.has(productName)) next.delete(productName);
      else next.add(productName);
      return next;
    });
  };

  return (
    <Stack>
      <RecipeAutocomplete
        dispatch={dispatch}
        selectedRecipes={recipes}
        data={data}
      />
      <Box
        component="ul"
        aria-label="产品成本树"
        sx={{ listStyle: 'none', m: 0, p: 0 }}
      >
        {productForest.map((node) => (
          <ProductTreeBranch
            key={node.product.name}
            node={node}
            dispatch={dispatch}
            recipes={recipes}
            data={data}
            collapsedProducts={collapsedProducts}
            onToggle={toggleProduct}
            estimatedQuantities={estimatedQuantities}
            rootProducts={rootProducts}
          />
        ))}
      </Box>
    </Stack>
  );
};

export interface ProductTreeNode {
  product: Item;
  children: ProductTreeNode[];
}

export interface ProductTreeRow {
  product: Item;
  depth: number;
}

export function buildProductTree(
  products: ItemMap,
  recipes: CraftingRecipeMap,
): ProductTreeRow[] {
  const result: ProductTreeRow[] = [];
  const visit = (node: ProductTreeNode, depth: number) => {
    result.push({ product: node.product, depth });
    node.children.forEach((child) => visit(child, depth + 1));
  };
  buildProductForest(products, recipes).forEach((node) => visit(node, 0));
  return result;
}

export function buildProductForest(
  products: ItemMap,
  recipes: CraftingRecipeMap,
): ProductTreeNode[] {
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

  const visited = new Set<string>();
  const buildNode = (product: Item): ProductTreeNode | undefined => {
    if (visited.has(product.name)) return undefined;
    visited.add(product.name);
    const children = childrenByParent.get(product.name) ?? new Set<string>();
    return {
      product,
      children: productList
        .filter((candidate) => children.has(candidate.name))
        .map(buildNode)
        .filter((child): child is ProductTreeNode => child !== undefined),
    };
  };

  const roots = productList
    .filter((product) => !childNames.has(product.name))
    .map(buildNode)
    .filter((node): node is ProductTreeNode => node !== undefined);
  productList.forEach((product) => {
    const node = buildNode(product);
    if (node) roots.push(node);
  });
  return roots;
}

interface ProductTreeBranchProps {
  node: ProductTreeNode;
  dispatch: React.Dispatch<Action>;
  recipes: CraftingRecipeMap;
  data: Recipe[];
  collapsedProducts: Set<string>;
  onToggle: (productName: string) => void;
  estimatedQuantities: Map<string, number>;
  rootProducts: Set<string>;
  nested?: boolean;
}

const ProductTreeBranch: React.FC<ProductTreeBranchProps> = ({
  node,
  dispatch,
  recipes,
  data,
  collapsedProducts,
  onToggle,
  estimatedQuantities,
  rootProducts,
  nested = false,
}) => {
  const hasChildren = node.children.length > 0;
  const collapsed = collapsedProducts.has(node.product.name);

  return (
    <Box
      component="li"
      sx={{
        listStyle: 'none',
        position: 'relative',
        ...(nested && {
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: -9,
            height: 20,
            borderLeft: 1,
            borderColor: 'divider',
          },
          '&:not(:last-of-type)::before': {
            height: 'auto',
            bottom: 0,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            zIndex: 1,
            top: 20,
            left: -9,
            width: 9,
            borderTop: 1,
            borderColor: 'divider',
          },
        }),
      }}
    >
      <ProductRow
        dispatch={dispatch}
        recipes={recipes}
        product={node.product}
        data={data}
        hasChildren={hasChildren}
        collapsed={collapsed}
        onToggle={() => onToggle(node.product.name)}
        estimatedQuantity={estimatedQuantities.get(node.product.name) ?? 0}
        isRoot={rootProducts.has(node.product.name)}
      />
      {hasChildren && !collapsed && (
        <Box
          component="ul"
          role="group"
          sx={{
            listStyle: 'none',
            m: 0,
            ml: 1,
            p: 0,
            pl: 1,
          }}
        >
          {node.children.map((child) => (
            <ProductTreeBranch
              key={child.product.name}
              node={child}
              dispatch={dispatch}
              recipes={recipes}
              data={data}
              collapsedProducts={collapsedProducts}
              onToggle={onToggle}
              estimatedQuantities={estimatedQuantities}
              rootProducts={rootProducts}
              nested
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

interface ProductRowProps {
  dispatch: React.Dispatch<Action>;
  product: Item;
  recipes: CraftingRecipeMap;
  data: Recipe[];
  hasChildren: boolean;
  collapsed: boolean;
  onToggle: () => void;
  estimatedQuantity: number;
  isRoot: boolean;
}

const ProductRow: React.FC<ProductRowProps> = ({
  dispatch,
  recipes,
  product,
  data,
  hasChildren,
  collapsed,
  onToggle,
  estimatedQuantity,
  isRoot,
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
        minHeight: 40,
        minWidth: 0,
        position: 'relative',
        zIndex: 1,
        borderRadius: 1,
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      {hasChildren ? (
        <Tooltip title={collapsed ? '展开下级产品' : '折叠下级产品'}>
          <IconButton
            size="small"
            aria-label={`${collapsed ? '展开' : '折叠'}${localizeGameText(
              product.displayName,
            )}的下级产品`}
            aria-expanded={!collapsed}
            onClick={onToggle}
          >
            {collapsed ? <ChevronRightIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Tooltip>
      ) : (
        <Box aria-hidden sx={{ width: 34, flexShrink: 0 }} />
      )}
      <IconButton
        size="small"
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
      <Typography component="span" noWrap sx={{ minWidth: 0, flex: 1 }}>
        {localizeGameText(product.displayName)}
      </Typography>
      <Stack direction="row" alignItems="center" sx={{ flexShrink: 0, pr: 1 }}>
        <Tooltip title="按每个顶级产品制作一轮估算">
          <Chip
            size="small"
            variant="outlined"
            label={`${isRoot ? '产出' : '需'} ${formatEstimatedQuantity(
              estimatedQuantity,
            )}`}
            sx={{ mr: 0.75 }}
          />
        </Tooltip>
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
  const [resourceReduction, setResourceReduction] = React.useState(
    primaryRecipe?.resourceReduction || 0,
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
            <FlexItem>
              <Box>
                <Typography component="div">额外材料减免</Typography>
                <Typography variant="caption" color="text.secondary">
                  用于服务器额外天赋，并与模块倍率乘算
                </Typography>
              </Box>
              <NumberInput
                value={resourceReduction}
                onChange={(event) => {
                  const parsed = parseFloat(event.target.value);
                  setResourceReduction(
                    isNaN(parsed)
                      ? resourceReduction
                      : Math.max(0, Math.min(parsed, 100)),
                  );
                }}
                sx={{ width: 140, paddingLeft: 4 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">%</InputAdornment>
                  ),
                }}
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
              setFixedCost(primaryRecipe?.fixedCost || 0);
              setResourceReduction(primaryRecipe?.resourceReduction || 0);
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
                  resourceReduction,
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
