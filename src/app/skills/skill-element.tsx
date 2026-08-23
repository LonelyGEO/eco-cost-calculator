import { MenuItem, Stack, TextField, Tooltip, Typography } from '@mui/material';
import React from 'react';
import { FlexItem } from '../common/flex-grid-item';
import {
  Action,
  ActionType,
  CraftingStationMap,
  ProfessionMap,
} from '../common/state/state';
import { SkillLevelSelect } from './skill-level.select';
import { UpgradeLevelSelect } from './upgrade-level.select';

interface SkillSegmentProps {
  dispatch: React.Dispatch<Action>;
  professions: ProfessionMap;
  craftingStations: CraftingStationMap;
}
export const SkillSegment: React.FC<SkillSegmentProps> = ({
  dispatch,
  professions,
  craftingStations,
}) => {
  return (
    <Stack sx={{ paddingTop: 2 }}>
      {Array.from(professions.values()).map((profession) => (
        <React.Fragment key={profession.name}>
          <FlexItem>
            <Typography variant="h6" component="div">
              {profession.localizedName || profession.displayName}
            </Typography>
            <SkillLevelSelect dispatch={dispatch} profession={profession} />
          </FlexItem>
          <Stack sx={{ paddingLeft: 3, paddingBottom: 1 }} spacing={1}>
            {Array.from(
              new Map(
                profession.talents
                  .filter((talent) => profession.level >= talent.unlockLevel)
                  .map((talent) => [talent.groupName, talent]),
              ).values(),
            ).map((talent) => (
              <Tooltip
                key={talent.groupName}
                title={talent.description || talent.localizedName}
              >
                <TextField
                  select
                  size="small"
                  label={talent.localizedName || talent.displayName}
                  value={profession.selectedTalents[talent.groupName] ?? 0}
                  onChange={(event) =>
                    dispatch({
                      type: ActionType.UPDATE_PROFESSION,
                      updatedProfession: {
                        ...profession,
                        selectedTalents: {
                          ...profession.selectedTalents,
                          [talent.groupName]: Number(event.target.value),
                        },
                      },
                    })
                  }
                >
                  <MenuItem value={0}>未选择</MenuItem>
                  {Array.from(
                    { length: talent.maxLevel },
                    (_, index) => index + 1,
                  ).map((level) => (
                    <MenuItem key={level} value={level}>
                      {level} 级
                    </MenuItem>
                  ))}
                </TextField>
              </Tooltip>
            ))}
          </Stack>
          <Stack sx={{ paddingLeft: 3 }}>
            {Array.from(craftingStations.values())
              .filter((station) => station.profession.name === profession.name)
              .map((craftingStation) => (
                <FlexItem key={craftingStation.name}>
                  <Typography variant="subtitle2">
                    {craftingStation.localizedName ||
                      craftingStation.displayName}
                  </Typography>
                  <UpgradeLevelSelect
                    dispatch={dispatch}
                    craftingStation={craftingStation}
                  />
                </FlexItem>
              ))}
          </Stack>
        </React.Fragment>
      ))}
    </Stack>
  );
};
