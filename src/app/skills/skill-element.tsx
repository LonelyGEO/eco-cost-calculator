import {
  Box,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React from 'react';
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
    <Stack spacing={2} sx={{ pt: 2 }}>
      {Array.from(professions.values()).map((profession) => {
        const unlockedTalents = Array.from(
          new Map(
            profession.talents
              .filter((talent) => profession.level >= talent.unlockLevel)
              .map((talent) => [talent.groupName, talent]),
          ).values(),
        );
        const professionStations = Array.from(craftingStations.values()).filter(
          (station) => station.profession.name === profession.name,
        );

        return (
          <Box
            component="section"
            key={profession.name}
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: 'background.default',
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={2}
              sx={{ px: 2, py: 1.5, bgcolor: 'action.hover' }}
            >
              <Typography variant="h6" component="h5" fontWeight={700}>
                {profession.localizedName || profession.displayName}
              </Typography>
              <SkillLevelSelect dispatch={dispatch} profession={profession} />
            </Stack>

            {unlockedTalents.length > 0 && (
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  component="div"
                  sx={{ mb: 1 }}
                >
                  已解锁天赋
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
                    gap: 1.5,
                  }}
                >
                  {unlockedTalents.map((talent) => (
                    <Tooltip
                      key={talent.groupName}
                      title={talent.description || talent.localizedName}
                    >
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label={talent.localizedName || talent.displayName}
                        value={
                          profession.selectedTalents[talent.groupName] ?? 0
                        }
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
                </Box>
              </Box>
            )}

            <Divider />
            <Stack spacing={1.5} sx={{ p: 2 }}>
              <Typography
                variant="overline"
                color="text.secondary"
                component="div"
              >
                制作站
              </Typography>
              {professionStations.map((craftingStation) => (
                <Box
                  key={craftingStation.name}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1.5,
                    p: 1.5,
                    bgcolor: 'background.paper',
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    component="h6"
                    fontWeight={700}
                    sx={{ mb: 1.25 }}
                  >
                    {craftingStation.localizedName ||
                      craftingStation.displayName}
                  </Typography>
                  <UpgradeLevelSelect
                    dispatch={dispatch}
                    craftingStation={craftingStation}
                  />
                </Box>
              ))}
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
};
