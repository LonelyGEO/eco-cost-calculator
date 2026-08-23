import { Box, MenuItem, TextField, Tooltip, Typography } from '@mui/material';
import React from 'react';
import { ModuleDefinition, modulesByName } from '../../data/recipes';
import { Action, ActionType, CraftingStation } from '../common/state/state';

const slotLabels: Record<string, string> = {
  BasicModule: '基础模块槽',
  AdvancedModule: '进阶模块槽',
  ModernModule: '现代模块槽',
  SpecialtyModule: '专业模块槽',
};

interface UpgradeLevelSelectProps {
  dispatch: React.Dispatch<Action>;
  craftingStation: CraftingStation;
}

export const UpgradeLevelSelect: React.FC<UpgradeLevelSelectProps> = ({
  dispatch,
  craftingStation,
}) => {
  const availableSlots = craftingStation.moduleSlots.flatMap((slot) => {
    const candidates = craftingStation.pluginModules
      .map((moduleName) => modulesByName.get(moduleName))
      .filter((module): module is ModuleDefinition =>
        Boolean(module && module.slot === slot),
      );
    return candidates.length ? [{ slot, candidates }] : [];
  });

  if (!availableSlots.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        无需配置模块
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'minmax(96px, 0.7fr) minmax(170px, 1.3fr)',
        },
        columnGap: 1.5,
        rowGap: 1,
        alignItems: 'center',
      }}
    >
      {availableSlots.map(({ slot, candidates }) => (
        <React.Fragment key={slot}>
          <Typography variant="body2" color="text.secondary">
            {slotLabels[slot] ?? slot}
          </Typography>
          <Tooltip title="同一槽位只能安装一个模块，已安装模块的所有匹配加成会同时生效。">
            <TextField
              fullWidth
              size="small"
              select
              value={craftingStation.selectedModules[slot] ?? ''}
              inputProps={{
                'aria-label': `${
                  craftingStation.localizedName || craftingStation.displayName
                } ${slotLabels[slot] ?? slot}`,
              }}
              onChange={(event) => {
                const selectedModules = { ...craftingStation.selectedModules };
                if (event.target.value)
                  selectedModules[slot] = event.target.value;
                else delete selectedModules[slot];

                dispatch({
                  type: ActionType.UPDATE_CRAFTING_STATION_UPGRADE,
                  updatedCraftingStation: {
                    ...craftingStation,
                    selectedModules,
                  },
                });
              }}
            >
              <MenuItem value="">不安装模块</MenuItem>
              {candidates.map((module) => (
                <MenuItem key={module.name} value={module.name}>
                  {module.localizedName || module.displayName}
                </MenuItem>
              ))}
            </TextField>
          </Tooltip>
        </React.Fragment>
      ))}
    </Box>
  );
};
