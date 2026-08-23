import { TextField } from '@mui/material';
import { Action, ActionType, ProfessionState } from '../common/state/state';

interface SkillLevelSelectProps {
  dispatch: React.Dispatch<Action>;
  profession: ProfessionState;
}
export const SkillLevelSelect: React.FC<SkillLevelSelectProps> = ({
  dispatch,
  profession,
}) => {
  return (
    <TextField
      size="small"
      label="等级"
      type="number"
      sx={{ width: 88, flexShrink: 0 }}
      value={profession.level}
      inputProps={{ min: 0, max: profession.maxLevel, step: 1 }}
      onChange={(event) => {
        const parsed = parseInt(event.target.value, 10);

        dispatch({
          type: ActionType.UPDATE_PROFESSION,
          updatedProfession: {
            ...profession,
            level: Math.min(
              Math.max(isNaN(parsed) ? profession.level : parsed, 0),
              profession.maxLevel,
            ),
          },
        });
      }}
    />
  );
};
