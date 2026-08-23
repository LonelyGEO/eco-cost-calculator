import React from 'react';

import { Autocomplete, createFilterOptions, TextField } from '@mui/material';
import { Action, ActionType, CraftingRecipeMap } from '../common/state/state';
import { Recipe } from '../../data/recipes';
import parse from 'autosuggest-highlight/parse';
import match from 'autosuggest-highlight/match';
import styled from 'styled-components';
import { localizeGameText } from '../../data/localization';

const StyledListItem = styled.li`
  background-color: rgba(255, 255, 255, 0.05);
`;

interface RecipeAutocompleteProps {
  dispatch: React.Dispatch<Action>;
  data: Recipe[];
  selectedRecipes: CraftingRecipeMap;
}

const filterOptions = createFilterOptions<Recipe>({
  stringify: (option) => `${localizeGameText(option.name)} ${option.name}`,
});

export const RecipeAutocomplete: React.FC<RecipeAutocompleteProps> = ({
  dispatch,
  data,
  selectedRecipes,
}) => {
  return (
    <Autocomplete
      multiple
      options={data}
      filterOptions={filterOptions}
      sx={{ paddingLeft: 4, paddingRight: 4, paddingBottom: 2 }}
      value={Array.from(selectedRecipes.values())}
      onChange={(_, values) => {
        if (!values) return;
        values.forEach((value) => {
          if (selectedRecipes.has(value.name)) return;
          dispatch({
            type: ActionType.ADD_RECIPE,
            addedRecipe: {
              ...value,
              price: 0,
              highlighted: false,
            },
          });
        });
      }}
      getOptionLabel={(option) => localizeGameText(option.name)}
      renderInput={(params) => <TextField {...params} label="选择制作配方" />}
      noOptionsText="没有匹配的配方"
      openText="展开"
      closeText="收起"
      clearText="清除"
      isOptionEqualToValue={(option, value) => option.name === value.name}
      renderTags={() => null}
      renderOption={(props, option, { inputValue }) => {
        const localizedName = localizeGameText(option.name);
        const matches = match(localizedName, inputValue);
        const parts = parse(localizedName, matches);

        return (
          <StyledListItem {...props}>
            <div>
              {parts.map((part, index) => (
                <span
                  key={index}
                  style={{
                    fontWeight: part.highlight ? 900 : 400,
                  }}
                >
                  {part.text}
                </span>
              ))}
            </div>
          </StyledListItem>
        );
      }}
    />
  );
};
