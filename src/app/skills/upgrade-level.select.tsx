import { MenuItem, Stack, TextField, Tooltip } from '@mui/material';
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
  return (
    <Stack spacing={1} sx={{ width: 250 }}>
      {craftingStation.moduleSlots.map((slot) => {
        const candidates = craftingStation.pluginModules
          .map((moduleName) => modulesByName.get(moduleName))
          .filter((module): module is ModuleDefinition =>
            Boolean(module && module.slot === slot),
          );
        if (candidates.length === 0) return null;

        return (
          <Tooltip
            key={slot}
            title="同一槽位只能安装一个模块，已安装模块的所有匹配加成会同时生效。"
          >
            <TextField
              size="small"
              select
              label={slotLabels[slot] ?? slot}
              value={craftingStation.selectedModules[slot] ?? ''}
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
        );
      })}
    </Stack>
  );
};
