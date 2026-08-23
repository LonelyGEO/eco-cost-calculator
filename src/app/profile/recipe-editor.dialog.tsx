import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React from 'react';
import {
  craftingTables,
  Ingredient,
  Modifier,
  Product,
  Recipe,
  skillDefinitions,
} from '../../data/recipes';
import { Action, ActionType } from '../common/state/state';

interface RecipeEditorDialogProps {
  open: boolean;
  recipes: Recipe[];
  customRecipes: Map<string, Recipe>;
  dispatch: React.Dispatch<Action>;
  onClose: () => void;
}

function cloneRecipe(recipe: Recipe): Recipe {
  return JSON.parse(JSON.stringify(recipe)) as Recipe;
}

function moduleModifiers(modifiers: Modifier[], enabled: boolean): Modifier[] {
  const retained = modifiers.filter(
    (modifier) => modifier.dynamicType !== 'Module',
  );
  return enabled
    ? [...retained, { dynamicType: 'Module', valueType: 'Efficiency' }]
    : retained;
}

function newRecipe(): Recipe {
  const skill = skillDefinitions[0];
  const table = craftingTables[0];
  const product: Product = {
    name: `CustomProductItem${Date.now()}`,
    displayName: 'Custom Product',
    localizedName: '自定义产品',
    quantity: 1,
    modifiers: [],
    isConstant: true,
    itemTags: [],
    isRefund: false,
  };

  return {
    name: `CustomRecipe${Date.now()}`,
    displayName: 'Custom Recipe',
    localizedName: '自定义配方',
    familyName: 'Custom Recipe',
    isBlueprint: false,
    isDefault: true,
    ingredients: [
      {
        name: `CustomIngredientItem${Date.now()}`,
        tag: null,
        displayName: 'Custom Ingredient',
        localizedName: '自定义原料',
        quantity: 1,
        modifiers: [{ dynamicType: 'Module', valueType: 'Efficiency' }],
        isConstant: false,
      },
    ],
    products: [product],
    mainProduct: product,
    byproducts: [],
    calories: 0,
    laborModifiers: [{ dynamicType: 'Skill', item: skill.name }],
    craftMinutes: 1,
    craftMinuteModifiers: [{ dynamicType: 'Module', valueType: 'Speed' }],
    experience: 0,
    table: table.name,
    tableDisplayName: table.displayName,
    tableLocalizedName: table.localizedName,
    professions: [{ ...skill, level: 0 }],
  };
}

export const RecipeEditorDialog: React.FC<RecipeEditorDialogProps> = ({
  open,
  recipes,
  customRecipes,
  dispatch,
  onClose,
}) => {
  const [draft, setDraft] = React.useState<Recipe | null>(null);
  const [error, setError] = React.useState('');

  const selectRecipe = (recipe: Recipe | null) => {
    setDraft(recipe ? cloneRecipe(recipe) : null);
    setError('');
  };

  const updateIngredient = (index: number, patch: Partial<Ingredient>) => {
    if (!draft) return;
    const ingredients = [...draft.ingredients];
    ingredients[index] = { ...ingredients[index], ...patch } as Ingredient;
    setDraft({ ...draft, ingredients });
  };

  const updateProduct = (index: number, patch: Partial<Product>) => {
    if (!draft) return;
    const products = [...draft.products];
    products[index] = { ...products[index], ...patch };
    setDraft({ ...draft, products });
  };

  const saveRecipe = () => {
    if (!draft) return;
    if (!draft.name.trim() || !draft.localizedName.trim()) {
      setError('配方标识和中文名称不能为空。');
      return;
    }
    if (draft.ingredients.length === 0 || draft.products.length === 0) {
      setError('配方至少需要一项原料和一项产品。');
      return;
    }
    if (
      [...draft.ingredients, ...draft.products].some(
        (item) => item.quantity <= 0 || !(item.name ?? item.tag)?.trim(),
      )
    ) {
      setError('所有原料和产品都必须有标识，数量必须大于 0。');
      return;
    }

    const products = draft.products.map((product) => ({ ...product }));
    const mainProduct =
      products.find((product) => !product.isRefund) ?? products[0];
    const recipe: Recipe = {
      ...draft,
      familyName: draft.familyName || draft.displayName || draft.name,
      ingredients: draft.ingredients.map((ingredient) => ({ ...ingredient })),
      products,
      mainProduct,
      byproducts: products.filter((product) => product !== mainProduct),
    };

    dispatch({ type: ActionType.UPSERT_CUSTOM_RECIPE, recipe });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>配方编辑器</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ paddingTop: 1 }}>
          <Alert severity="info">
            修改会作为当前方案的本地覆盖保存；官方原版数据不会被改写。保存后将清空当前已选择的产品、原料价格和计算链，以避免混用旧计算结果。
          </Alert>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
            <Autocomplete
              fullWidth
              options={recipes}
              value={
                draft
                  ? recipes.find((recipe) => recipe.name === draft.name) ?? null
                  : null
              }
              onChange={(_, recipe) => selectRecipe(recipe)}
              getOptionLabel={(recipe) =>
                `${recipe.localizedName}（${recipe.name}）`
              }
              isOptionEqualToValue={(option, value) =>
                option.name === value.name
              }
              renderInput={(params) => (
                <TextField {...params} label="选择要修改的原版或自定义配方" />
              )}
            />
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => selectRecipe(newRecipe())}
            >
              新建
            </Button>
            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              disabled={!draft}
              onClick={() => {
                if (!draft) return;
                const copy = cloneRecipe(draft);
                copy.name = `${draft.name}Custom${Date.now()}`;
                copy.displayName = `${draft.displayName} Custom`;
                copy.localizedName = `${draft.localizedName}（自定义）`;
                selectRecipe(copy);
              }}
            >
              复制
            </Button>
          </Stack>

          {draft && (
            <>
              {error && <Alert severity="error">{error}</Alert>}
              <Typography variant="h6">基本信息</Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                  gap: 1,
                }}
              >
                <TextField
                  label="配方内部标识"
                  value={draft.name}
                  onChange={(event) =>
                    setDraft({ ...draft, name: event.target.value })
                  }
                  helperText="覆盖原配方时保持不变"
                />
                <TextField
                  label="中文名称"
                  value={draft.localizedName}
                  onChange={(event) =>
                    setDraft({ ...draft, localizedName: event.target.value })
                  }
                />
                <TextField
                  label="英文名称"
                  value={draft.displayName}
                  onChange={(event) =>
                    setDraft({ ...draft, displayName: event.target.value })
                  }
                />
                <TextField
                  select
                  label="制作站"
                  value={draft.table}
                  onChange={(event) => {
                    const table = craftingTables.find(
                      (candidate) => candidate.name === event.target.value,
                    );
                    if (!table) return;
                    setDraft({
                      ...draft,
                      table: table.name,
                      tableDisplayName: table.displayName,
                      tableLocalizedName: table.localizedName,
                    });
                  }}
                >
                  {craftingTables.map((table) => (
                    <MenuItem key={table.name} value={table.name}>
                      {table.localizedName}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="技能"
                  value={draft.professions[0].name}
                  onChange={(event) => {
                    const skill = skillDefinitions.find(
                      (candidate) => candidate.name === event.target.value,
                    );
                    if (!skill) return;
                    const removeOldTalentModifiers = (modifiers: Modifier[]) =>
                      modifiers.filter(
                        (modifier) =>
                          modifier.dynamicType !== 'Talent' &&
                          modifier.dynamicType !== 'Skill',
                      );
                    setDraft({
                      ...draft,
                      professions: [{ ...skill, level: 0 }],
                      laborModifiers: [
                        ...removeOldTalentModifiers(draft.laborModifiers),
                        { dynamicType: 'Skill', item: skill.name },
                      ],
                      ingredients: draft.ingredients.map((ingredient) => ({
                        ...ingredient,
                        modifiers: removeOldTalentModifiers(
                          ingredient.modifiers,
                        ),
                      })) as Ingredient[],
                      products: draft.products.map((product) => ({
                        ...product,
                        modifiers: removeOldTalentModifiers(product.modifiers),
                      })),
                    });
                  }}
                >
                  {skillDefinitions.map((skill) => (
                    <MenuItem key={skill.name} value={skill.name}>
                      {skill.localizedName}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="所需技能等级"
                  type="number"
                  value={draft.professions[0].level}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      professions: [
                        {
                          ...draft.professions[0],
                          level: Number(event.target.value),
                        },
                      ],
                    })
                  }
                />
                <TextField
                  label="基础劳动力"
                  type="number"
                  value={draft.calories}
                  onChange={(event) =>
                    setDraft({ ...draft, calories: Number(event.target.value) })
                  }
                />
                <TextField
                  label="基础制作分钟"
                  type="number"
                  value={draft.craftMinutes}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      craftMinutes: Number(event.target.value),
                    })
                  }
                />
              </Box>

              <Typography variant="h6">原料</Typography>
              {draft.ingredients.map((ingredient, index) => (
                <Box
                  key={`${index}-${ingredient.name ?? ingredient.tag}`}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 2,
                    bgcolor: 'background.default',
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 1.5 }}
                  >
                    <Typography fontWeight={700}>原料 {index + 1}</Typography>
                    <Tooltip title="删除这项原料">
                      <IconButton
                        size="small"
                        aria-label={`删除原料 ${index + 1}`}
                        onClick={() =>
                          setDraft({
                            ...draft,
                            ingredients: draft.ingredients.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          })
                        }
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        md: '120px minmax(220px, 1.2fr) minmax(180px, 1fr) 110px',
                      },
                      gap: 1.5,
                    }}
                  >
                    <TextField
                      select
                      label="类型"
                      value={ingredient.tag ? 'tag' : 'item'}
                      onChange={(event) => {
                        const key = ingredient.name ?? ingredient.tag ?? '';
                        updateIngredient(
                          index,
                          event.target.value === 'tag'
                            ? { name: null, tag: key }
                            : { name: key, tag: null },
                        );
                      }}
                    >
                      <MenuItem value="item">物品</MenuItem>
                      <MenuItem value="tag">标签</MenuItem>
                    </TextField>
                    <TextField
                      label="物品/标签内部标识"
                      value={ingredient.name ?? ingredient.tag ?? ''}
                      onChange={(event) =>
                        updateIngredient(
                          index,
                          ingredient.tag
                            ? { tag: event.target.value }
                            : { name: event.target.value },
                        )
                      }
                    />
                    <TextField
                      label="中文名称"
                      value={ingredient.localizedName}
                      onChange={(event) =>
                        updateIngredient(index, {
                          localizedName: event.target.value,
                          displayName:
                            ingredient.displayName || event.target.value,
                        })
                      }
                    />
                    <TextField
                      label="数量"
                      type="number"
                      value={ingredient.quantity}
                      onChange={(event) =>
                        updateIngredient(index, {
                          quantity: Number(event.target.value),
                        })
                      }
                    />
                  </Box>
                  <FormControlLabel
                    label="受模块影响"
                    sx={{ mt: 1, ml: 0, whiteSpace: 'nowrap' }}
                    control={
                      <Checkbox
                        checked={ingredient.modifiers.some(
                          (modifier) => modifier.dynamicType === 'Module',
                        )}
                        onChange={(event) =>
                          updateIngredient(index, {
                            modifiers: moduleModifiers(
                              ingredient.modifiers,
                              event.target.checked,
                            ),
                            isConstant: !event.target.checked,
                          })
                        }
                      />
                    }
                  />
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                sx={{ alignSelf: 'flex-start' }}
                onClick={() =>
                  setDraft({
                    ...draft,
                    ingredients: [
                      ...draft.ingredients,
                      {
                        name: `CustomIngredientItem${Date.now()}`,
                        tag: null,
                        displayName: 'Custom Ingredient',
                        localizedName: '自定义原料',
                        quantity: 1,
                        modifiers: [
                          { dynamicType: 'Module', valueType: 'Efficiency' },
                        ],
                        isConstant: false,
                      },
                    ],
                  })
                }
              >
                添加原料
              </Button>

              <Typography variant="h6">产品与副产品</Typography>
              {draft.products.map((product, index) => (
                <Box
                  key={`${index}-${product.name}`}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 2,
                    bgcolor: 'background.default',
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 1.5 }}
                  >
                    <Typography fontWeight={700}>
                      {index ===
                      draft.products.findIndex(
                        (candidate) => !candidate.isRefund,
                      )
                        ? '主产品'
                        : `副产品 ${index + 1}`}
                    </Typography>
                    <Tooltip title="删除这项产品">
                      <IconButton
                        size="small"
                        aria-label={`删除产品 ${index + 1}`}
                        onClick={() =>
                          setDraft({
                            ...draft,
                            products: draft.products.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          })
                        }
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        md: 'minmax(240px, 1.2fr) minmax(200px, 1fr) 110px',
                      },
                      gap: 1.5,
                    }}
                  >
                    <TextField
                      label="物品内部标识"
                      value={product.name}
                      onChange={(event) =>
                        updateProduct(index, { name: event.target.value })
                      }
                    />
                    <TextField
                      label="中文名称"
                      value={product.localizedName}
                      onChange={(event) =>
                        updateProduct(index, {
                          localizedName: event.target.value,
                          displayName:
                            product.displayName || event.target.value,
                        })
                      }
                    />
                    <TextField
                      label="数量"
                      type="number"
                      value={product.quantity}
                      onChange={(event) =>
                        updateProduct(index, {
                          quantity: Number(event.target.value),
                        })
                      }
                    />
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 2,
                      mt: 1,
                    }}
                  >
                    <FormControlLabel
                      label="受产量加成影响"
                      sx={{ m: 0, whiteSpace: 'nowrap' }}
                      control={
                        <Checkbox
                          checked={product.modifiers.some(
                            (modifier) => modifier.dynamicType === 'Module',
                          )}
                          onChange={(event) =>
                            updateProduct(index, {
                              modifiers: moduleModifiers(
                                product.modifiers,
                                event.target.checked,
                              ),
                              isConstant: !event.target.checked,
                            })
                          }
                        />
                      }
                    />
                    <FormControlLabel
                      label="返还原料"
                      sx={{ m: 0, whiteSpace: 'nowrap' }}
                      control={
                        <Checkbox
                          checked={product.isRefund}
                          onChange={(event) =>
                            updateProduct(index, {
                              isRefund: event.target.checked,
                            })
                          }
                        />
                      }
                    />
                  </Box>
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                sx={{ alignSelf: 'flex-start' }}
                onClick={() =>
                  setDraft({
                    ...draft,
                    products: [
                      ...draft.products,
                      {
                        name: `CustomProductItem${Date.now()}`,
                        displayName: 'Custom Product',
                        localizedName: '自定义产品',
                        quantity: 1,
                        modifiers: [],
                        isConstant: true,
                        itemTags: [],
                        isRefund: false,
                      },
                    ],
                  })
                }
              >
                添加产品/副产品
              </Button>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        {draft && customRecipes.has(draft.name) && (
          <Button
            color="warning"
            startIcon={<RestoreIcon />}
            onClick={() => {
              dispatch({
                type: ActionType.DELETE_CUSTOM_RECIPE,
                recipeName: draft.name,
              });
              onClose();
            }}
          >
            恢复官方版本
          </Button>
        )}
        <Button onClick={onClose}>取消</Button>
        <Button variant="contained" disabled={!draft} onClick={saveRecipe}>
          保存覆盖配方
        </Button>
      </DialogActions>
    </Dialog>
  );
};
