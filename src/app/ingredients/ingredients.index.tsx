import {
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import React from 'react';
import { FlexItem } from '../common/flex-grid-item';
import { NumberInput } from '../common/number-input';
import {
  Action,
  ActionType,
  Item,
  ItemMap,
  TagSelection,
} from '../common/state/state';
import { useDebounce } from '../common/use-debounce.hook';
import AddIcon from '@mui/icons-material/Add';
import TuneIcon from '@mui/icons-material/Tune';
import styled from 'styled-components';
import { localizeGameText } from '../../data/localization';
import { tagsByName } from '../../data/recipes';
import { TagSelectionDialog } from './tag-selection.dialog';
import { formatEstimatedQuantity } from '../common/state/get-bill-of-materials';

const LabelGroup = styled.div`
  display: flex;
  align-items: center;
`;

interface IngredientsProps {
  dispatch: React.Dispatch<Action>;
  inputs: ItemMap;
  products: ItemMap;
  byproducts: ItemMap;
  tagSelections: Map<string, TagSelection>;
  estimatedInputQuantities: Map<string, number>;
  estimatedProductQuantities: Map<string, number>;
  estimatedByproductQuantities: Map<string, number>;
}
export const Ingredients: React.FC<IngredientsProps> = ({
  dispatch,
  inputs,
  products,
  byproducts,
  tagSelections,
  estimatedInputQuantities,
  estimatedProductQuantities,
  estimatedByproductQuantities,
}) => {
  const hasByproducts = byproducts.size > 0;
  const selectedCandidateNames = new Set(
    Array.from(tagSelections.values()).flatMap((selection) =>
      selection.candidates.map(({ name }) => name),
    ),
  );
  return (
    <Stack>
      {hasByproducts && <Typography variant="h5">原料</Typography>}
      {Array.from(inputs.values())
        .filter((input) => !selectedCandidateNames.has(input.name))
        .map((input) => {
          const tag = tagsByName.get(input.name);
          if (tag) {
            return (
              <TagIngredient
                key={input.name}
                dispatch={dispatch}
                item={input}
                products={products}
                inputs={inputs}
                selection={tagSelections.get(input.name)}
                tagName={input.name}
                estimatedInputQuantities={estimatedInputQuantities}
                estimatedProductQuantities={estimatedProductQuantities}
              />
            );
          }
          return (
            <Ingredient
              key={input.name}
              dispatch={dispatch}
              item={input}
              updateAction={ActionType.UPDATE_ITEM_PRICE}
              estimatedQuantity={estimatedInputQuantities.get(input.name) ?? 0}
            />
          );
        })}
      {hasByproducts && <Typography variant="h5">副产品</Typography>}
      {Array.from(byproducts.values()).map((byproduct) => (
        <Ingredient
          key={byproduct.name}
          dispatch={dispatch}
          item={byproduct}
          updateAction={ActionType.UPDATE_BYPRODUCT_PRICE}
          estimatedQuantity={
            estimatedByproductQuantities.get(byproduct.name) ?? 0
          }
          quantityPrefix="产出"
        />
      ))}
    </Stack>
  );
};

interface TagIngredientProps {
  dispatch: React.Dispatch<Action>;
  item: Item;
  inputs: ItemMap;
  products: ItemMap;
  selection?: TagSelection;
  tagName: string;
  estimatedInputQuantities: Map<string, number>;
  estimatedProductQuantities: Map<string, number>;
}

const TagIngredient: React.FC<TagIngredientProps> = ({
  dispatch,
  item,
  inputs,
  products,
  selection,
  tagName,
  estimatedInputQuantities,
  estimatedProductQuantities,
}) => {
  const [open, setOpen] = React.useState(false);
  const tag = tagsByName.get(tagName);
  if (!tag) return null;

  const summary = selection
    ? `${selection.mode === 'cheapest' ? '自动最低价' : '固定配比'} · ${
        selection.candidates.length
      } 项`
    : undefined;

  return (
    <>
      <Ingredient
        dispatch={dispatch}
        item={item}
        updateAction={ActionType.UPDATE_ITEM_PRICE}
        hidePrice={Boolean(selection)}
        estimatedQuantity={estimatedInputQuantities.get(item.name) ?? 0}
        labelAction={
          <Stack direction="row" spacing={1} alignItems="center">
            {summary && <Chip size="small" label={summary} />}
            <Tooltip title="选择该品类可用的具体材料">
              <IconButton
                aria-label={`配置${tag.localizedName}材料`}
                onClick={() => setOpen(true)}
              >
                <TuneIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        }
      />
      {selection?.candidates.map(({ name, ratio }) => {
        const candidate = inputs.get(name) ?? products.get(name);
        if (!candidate) return null;
        return (
          <Box
            key={name}
            sx={{ pl: 2, borderLeft: '2px solid', borderColor: 'divider' }}
          >
            <Ingredient
              dispatch={dispatch}
              item={candidate}
              updateAction={ActionType.UPDATE_ITEM_PRICE}
              readOnly={products.has(name)}
              suffix={selection.mode === 'mix' ? `${ratio}%` : undefined}
              estimatedQuantity={
                (products.has(name)
                  ? estimatedProductQuantities
                  : estimatedInputQuantities
                ).get(name) ?? 0
              }
            />
          </Box>
        );
      })}
      <TagSelectionDialog
        open={open}
        tag={tag}
        selection={selection}
        onClose={() => setOpen(false)}
        onApply={(nextSelection) => {
          dispatch({
            type: ActionType.UPDATE_TAG_SELECTION,
            tagName,
            selection: nextSelection,
          });
          setOpen(false);
        }}
      />
    </>
  );
};

interface IngredientProps {
  item: Item;
  dispatch: React.Dispatch<Action>;
  updateAction:
    | ActionType.UPDATE_ITEM_PRICE
    | ActionType.UPDATE_BYPRODUCT_PRICE;
  hidePrice?: boolean;
  labelAction?: React.ReactNode;
  readOnly?: boolean;
  suffix?: string;
  estimatedQuantity?: number;
  quantityPrefix?: '需' | '产出';
}
const Ingredient: React.FC<IngredientProps> = ({
  item,
  dispatch,
  updateAction,
  hidePrice = false,
  labelAction,
  readOnly = false,
  suffix,
  estimatedQuantity,
  quantityPrefix = '需',
}) => {
  const [price, setPrice] = React.useState<number>(item.price);
  const debouncedPrice = useDebounce(price, 250);

  const itemName = item.name;
  const itemPrice = item.price;
  React.useEffect(() => {
    if (itemPrice !== debouncedPrice) setPrice(itemPrice);
    // Only synchronize externally calculated product prices.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemPrice]);
  React.useEffect(() => {
    if (readOnly || hidePrice) return;
    if (itemPrice === debouncedPrice) return;
    dispatch({
      type: updateAction,
      updatedItem: {
        name: itemName,
        price: debouncedPrice || 0,
      },
    });
  }, [
    debouncedPrice,
    itemName,
    itemPrice,
    dispatch,
    updateAction,
    readOnly,
    hidePrice,
  ]);

  return (
    <FlexItem>
      <LabelGroup>
        <Typography component="div">
          {localizeGameText(item.displayName)}{' '}
        </Typography>
        {item.canBeProduced && (
          <Tooltip title="添加该物品的配方">
            <IconButton
              aria-label={`添加${localizeGameText(item.displayName)}的配方`}
              onClick={() =>
                dispatch({
                  type: ActionType.ADD_RECIPE_FROM_INPUT,
                  input: item,
                })
              }
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        )}
        {suffix && <Chip size="small" label={suffix} sx={{ ml: 1 }} />}
        {estimatedQuantity !== undefined && (
          <Tooltip title="按每个顶级产品制作一轮估算">
            <Chip
              size="small"
              variant="outlined"
              label={`${quantityPrefix} ${formatEstimatedQuantity(
                estimatedQuantity,
              )}`}
              sx={{ ml: 1 }}
            />
          </Tooltip>
        )}
        {labelAction}
      </LabelGroup>
      {!hidePrice && (
        <NumberInput
          sx={{ width: 120 }}
          value={price}
          disabled={readOnly}
          onChange={(event) => {
            try {
              const numberValue = parseFloat(event.target.value);
              setPrice(numberValue);
            } catch (error) {
              console.warn(error);
            }
          }}
        />
      )}
    </FlexItem>
  );
};
