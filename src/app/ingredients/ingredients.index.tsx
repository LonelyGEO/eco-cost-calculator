import { IconButton, Stack, Tooltip, Typography } from '@mui/material';
import React from 'react';
import { FlexItem } from '../common/flex-grid-item';
import { NumberInput } from '../common/number-input';
import { Action, ActionType, Item, ItemMap } from '../common/state/state';
import { useDebounce } from '../common/use-debounce.hook';
import AddIcon from '@mui/icons-material/Add';
import styled from 'styled-components';
import { localizeGameText } from '../../data/localization';

const LabelGroup = styled.div`
  display: flex;
  align-items: center;
`;

interface IngredientsProps {
  dispatch: React.Dispatch<Action>;
  inputs: ItemMap;
  byproducts: ItemMap;
}
export const Ingredients: React.FC<IngredientsProps> = ({
  dispatch,
  inputs,
  byproducts,
}) => {
  const hasByproducts = byproducts.size > 0;
  return (
    <Stack>
      {hasByproducts && <Typography variant="h5">原料</Typography>}
      {Array.from(inputs.values()).map((input) => (
        <Ingredient
          key={input.name}
          dispatch={dispatch}
          item={input}
          updateAction={ActionType.UPDATE_ITEM_PRICE}
        />
      ))}
      {hasByproducts && <Typography variant="h5">副产品</Typography>}
      {Array.from(byproducts.values()).map((byproduct) => (
        <Ingredient
          key={byproduct.name}
          dispatch={dispatch}
          item={byproduct}
          updateAction={ActionType.UPDATE_BYPRODUCT_PRICE}
        />
      ))}
    </Stack>
  );
};

interface IngredientProps {
  item: Item;
  dispatch: React.Dispatch<Action>;
  updateAction:
    | ActionType.UPDATE_ITEM_PRICE
    | ActionType.UPDATE_BYPRODUCT_PRICE;
}
const Ingredient: React.FC<IngredientProps> = ({
  item,
  dispatch,
  updateAction,
}) => {
  const [price, setPrice] = React.useState<number>(item.price);
  const debouncedPrice = useDebounce(price, 250);

  const itemName = item.name;
  const itemPrice = item.price;
  React.useEffect(() => {
    if (itemPrice === debouncedPrice) return;
    dispatch({
      type: updateAction,
      updatedItem: {
        name: itemName,
        price: debouncedPrice || 0,
      },
    });
  }, [debouncedPrice, itemName, itemPrice, dispatch, updateAction]);

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
      </LabelGroup>
      <NumberInput
        sx={{ width: 120 }}
        value={price}
        onChange={(event) => {
          try {
            const numberValue = parseFloat(event.target.value);
            setPrice(numberValue);
          } catch (error) {
            console.warn(error);
          }
        }}
      />
    </FlexItem>
  );
};
