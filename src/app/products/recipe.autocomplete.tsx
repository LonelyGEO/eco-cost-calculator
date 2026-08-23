import React from 'react';

import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import { Action, ActionType, CraftingRecipeMap } from '../common/state/state';
import { Recipe } from '../../data/recipes';
import parse from 'autosuggest-highlight/parse';
import match from 'autosuggest-highlight/match';
import styled from 'styled-components';

const StyledListItem = styled.li`
  background-color: rgba(255, 255, 255, 0.05);
`;

interface RecipeAutocompleteProps {
  dispatch: React.Dispatch<Action>;
  data: Recipe[];
  selectedRecipes: CraftingRecipeMap;
}

type SearchScope = 'name' | 'station' | 'id';

function normalizeSearchText(value: string): string {
  return value.normalize('NFKC').trim().toLocaleLowerCase('zh-CN');
}

function parseSearchQuery(inputValue: string): {
  query: string;
  scope: SearchScope;
} {
  const normalized = normalizeSearchText(inputValue);
  const stationPrefix = normalized.match(/^(?:制作站|工作台)\s*[:：]\s*/);
  if (stationPrefix) {
    return {
      scope: 'station',
      query: normalized.slice(stationPrefix[0].length).trim(),
    };
  }
  const idPrefix = normalized.match(/^(?:id|配方id)\s*[:：]\s*/i);
  if (idPrefix) {
    return {
      scope: 'id',
      query: normalized.slice(idPrefix[0].length).trim(),
    };
  }
  return { scope: 'name', query: normalized };
}

function matchScore(value: string, query: string): number {
  const normalized = normalizeSearchText(value);
  if (normalized === query) return 0;
  if (normalized.startsWith(query)) return 1;
  if (normalized.includes(query)) return 2;
  return Number.POSITIVE_INFINITY;
}

export function filterRecipeOptions(
  options: Recipe[],
  { inputValue }: { inputValue: string },
): Recipe[] {
  const { query, scope } = parseSearchQuery(inputValue);
  if (!query) return options;

  return options
    .map((option, index) => {
      let score = Number.POSITIVE_INFINITY;
      if (scope === 'station') {
        score = Math.min(
          matchScore(option.tableLocalizedName, query),
          matchScore(option.tableDisplayName, query) + 3,
        );
      } else if (scope === 'id') {
        score = matchScore(option.name, query);
      } else {
        score = Math.min(
          matchScore(option.localizedName, query),
          matchScore(option.displayName, query) + 3,
        );
      }
      return { option, score, index };
    })
    .filter(({ score }) => Number.isFinite(score))
    .sort((left, right) => left.score - right.score || left.index - right.index)
    .map(({ option }) => option);
}

const HighlightedText: React.FC<{ source: string; query: string }> = ({
  source,
  query,
}) => {
  const matches = query ? match(source, query) : [];
  const parts = parse(source, matches);
  return (
    <>
      {parts.map((part, index) => (
        <span key={index} style={{ fontWeight: part.highlight ? 900 : 400 }}>
          {part.text}
        </span>
      ))}
    </>
  );
};

export const RecipeAutocomplete: React.FC<RecipeAutocompleteProps> = ({
  dispatch,
  data,
  selectedRecipes,
}) => {
  return (
    <Autocomplete
      multiple
      options={data}
      filterOptions={filterRecipeOptions}
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
      getOptionLabel={(option) => option.localizedName || option.displayName}
      renderInput={(params) => (
        <TextField
          {...params}
          label="选择制作配方"
          placeholder="输入产品名，或使用“制作站:名称”"
        />
      )}
      noOptionsText="没有匹配的配方"
      openText="展开"
      closeText="收起"
      clearText="清除"
      isOptionEqualToValue={(option, value) => option.name === value.name}
      renderTags={() => null}
      renderOption={(props, option, { inputValue }) => {
        const localizedName = option.localizedName || option.displayName;
        const { query, scope } = parseSearchQuery(inputValue);

        return (
          <StyledListItem {...props}>
            <Box sx={{ minWidth: 0 }}>
              <Typography component="div">
                <HighlightedText
                  source={localizedName}
                  query={scope === 'name' ? query : ''}
                />
              </Typography>
              <Typography
                component="div"
                variant="caption"
                color="text.secondary"
                noWrap
              >
                <HighlightedText
                  source={option.displayName}
                  query={scope === 'name' ? query : ''}
                />{' '}
                ·{' '}
                <HighlightedText
                  source={option.tableLocalizedName}
                  query={scope === 'station' ? query : ''}
                />
                {scope === 'id' && ` · ${option.name}`}
              </Typography>
            </Box>
          </StyledListItem>
        );
      }}
    />
  );
};
