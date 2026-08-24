import {
  Box,
  Chip,
  Collapse,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import React from 'react';
import {
  Action,
  ActionType,
  CraftingStationMap,
  ProfessionMap,
  ProfessionState,
} from '../common/state/state';
import { SkillLevelSelect } from './skill-level.select';
import { UpgradeLevelSelect } from './upgrade-level.select';
import {
  describeLumberRidgeTalent,
  getLumberRidgeTalentLabel,
  getLumberRidgeTalentsForSkill,
  LumberRidgeTalent,
} from '../../data/lumber-ridge';

interface SkillSegmentProps {
  dispatch: React.Dispatch<Action>;
  professions: ProfessionMap;
  craftingStations: CraftingStationMap;
  lumberRidgeEnabled?: boolean;
}
export const SkillSegment: React.FC<SkillSegmentProps> = ({
  dispatch,
  professions,
  craftingStations,
  lumberRidgeEnabled = false,
}) => {
  const [collapsedProfessions, setCollapsedProfessions] = React.useState<
    Set<string>
  >(() => new Set());

  const toggleProfession = (professionName: string) => {
    setCollapsedProfessions((current) => {
      const next = new Set(current);
      if (next.has(professionName)) next.delete(professionName);
      else next.add(professionName);
      return next;
    });
  };

  const updateLumberRidgeTalent = (
    profession: ProfessionState,
    talent: LumberRidgeTalent,
    level: number,
  ) => {
    const selected = { ...(profession.selectedLumberRidgeTalents ?? {}) };
    if (talent.choiceGroup && level > 0) {
      getLumberRidgeTalentsForSkill(profession.name)
        .filter((candidate) => candidate.choiceGroup === talent.choiceGroup)
        .forEach((candidate) => delete selected[candidate.groupName]);
    }
    if (level > 0) selected[talent.groupName] = level;
    else delete selected[talent.groupName];
    dispatch({
      type: ActionType.UPDATE_PROFESSION,
      updatedProfession: {
        ...profession,
        selectedLumberRidgeTalents: selected,
      },
    });
  };

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
        const collapsed = collapsedProfessions.has(profession.name);
        const professionLabel =
          profession.localizedName || profession.displayName;
        const lumberRidgeTalents = lumberRidgeEnabled
          ? getLumberRidgeTalentsForSkill(profession.name).filter(
              (talent) => profession.level >= talent.unlockLevel,
            )
          : [];
        const standaloneLumberRidgeTalents = lumberRidgeTalents.filter(
          (talent) => !talent.choiceGroup,
        );
        const lumberRidgeChoiceGroups = Array.from(
          lumberRidgeTalents
            .filter((talent) => talent.choiceGroup)
            .reduce((groups, talent) => {
              const choiceGroup = talent.choiceGroup;
              if (!choiceGroup) return groups;
              const group = groups.get(choiceGroup) ?? [];
              group.push(talent);
              groups.set(choiceGroup, group);
              return groups;
            }, new Map<string, LumberRidgeTalent[]>())
            .values(),
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
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <IconButton
                  size="small"
                  aria-label={`${
                    collapsed ? '展开' : '折叠'
                  }${professionLabel}`}
                  aria-expanded={!collapsed}
                  aria-controls={`profession-${profession.name}`}
                  onClick={() => toggleProfession(profession.name)}
                >
                  {collapsed ? <ChevronRightIcon /> : <ExpandMoreIcon />}
                </IconButton>
                <Typography variant="h6" component="h5" fontWeight={700}>
                  {professionLabel}
                </Typography>
              </Stack>
              <SkillLevelSelect dispatch={dispatch} profession={profession} />
            </Stack>

            <Collapse
              in={!collapsed}
              timeout="auto"
              unmountOnExit
              id={`profession-${profession.name}`}
            >
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
                                  [talent.groupName]: Number(
                                    event.target.value,
                                  ),
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

              {lumberRidgeTalents.length > 0 && (
                <Box sx={{ px: 2, pb: 1.5 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ mb: 1 }}
                  >
                    <Typography
                      variant="overline"
                      color="text.secondary"
                      component="div"
                    >
                      Lumber Ridge 模组天赋
                    </Typography>
                    <Chip label="v1.0.5" size="small" color="info" />
                  </Stack>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',
                      gap: 1.5,
                    }}
                  >
                    {standaloneLumberRidgeTalents.map((talent) => (
                      <Tooltip
                        key={talent.groupName}
                        title={describeLumberRidgeTalent(talent)}
                      >
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label={`${
                            talent.unlockLevel
                          }级 · ${getLumberRidgeTalentLabel(talent)}`}
                          value={
                            profession.selectedLumberRidgeTalents?.[
                              talent.groupName
                            ] ?? 0
                          }
                          onChange={(event) =>
                            updateLumberRidgeTalent(
                              profession,
                              talent,
                              Number(event.target.value),
                            )
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

                    {lumberRidgeChoiceGroups.map((talents) => {
                      const selectedTalent = talents.find(
                        (talent) =>
                          (profession.selectedLumberRidgeTalents?.[
                            talent.groupName
                          ] ?? 0) > 0,
                      );
                      const unlockLevel = talents[0]?.unlockLevel ?? 0;
                      return (
                        <TextField
                          key={talents[0].choiceGroup}
                          select
                          fullWidth
                          size="small"
                          label={`${unlockLevel}级 · 研究取向`}
                          value={selectedTalent?.groupName ?? ''}
                          onChange={(event) => {
                            const selected = talents.find(
                              (talent) =>
                                talent.groupName === event.target.value,
                            );
                            if (selected)
                              updateLumberRidgeTalent(profession, selected, 1);
                            else if (selectedTalent)
                              updateLumberRidgeTalent(
                                profession,
                                selectedTalent,
                                0,
                              );
                          }}
                          helperText={
                            selectedTalent
                              ? describeLumberRidgeTalent(selectedTalent)
                              : '三选一；影响研究论文或本职业全部配方'
                          }
                        >
                          <MenuItem value="">未选择</MenuItem>
                          {talents.map((talent) => (
                            <MenuItem
                              key={talent.groupName}
                              value={talent.groupName}
                            >
                              {getLumberRidgeTalentLabel(talent)}
                            </MenuItem>
                          ))}
                        </TextField>
                      );
                    })}
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
            </Collapse>
          </Box>
        );
      })}
    </Stack>
  );
};
