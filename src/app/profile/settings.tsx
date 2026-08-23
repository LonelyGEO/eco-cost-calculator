import {
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React from 'react';
import SettingsIcon from '@mui/icons-material/Settings';
import EditIcon from '@mui/icons-material/Edit';
import { FlexItem } from '../common/flex-grid-item';
import { ActionType, replacer } from '../common/state/state';
import { NumberInput } from '../common/number-input';
import styled from 'styled-components';
import { useActiveProfile, useProfiles } from '../common/state/state-provider';
import { dataMetadata } from '../../data/recipes';
import { RecipeEditorDialog } from './recipe-editor.dialog';

const Input = styled('input')({
  display: 'none',
});
interface SettingsProps {
  isVisible: boolean;
  setIsVisible: React.Dispatch<React.SetStateAction<boolean>>;
}
export const Settings: React.FC<SettingsProps> = ({
  setIsVisible,
  isVisible,
}) => {
  const activeProfile = useActiveProfile();
  const { dispatch, profiles } = useProfiles();
  const [profileName, setProfileName] = React.useState(activeProfile?.name);

  React.useEffect(() => {
    setProfileName(activeProfile?.name);
  }, [activeProfile?.id, activeProfile?.name]);

  const [showDangerousActions, setShowDangerousActions] = React.useState(false);
  const [showRecipeEditor, setShowRecipeEditor] = React.useState(false);

  if (!activeProfile) return null;
  return (
    <Paper sx={{ height: '100%', padding: 2 }}>
      <Stack>
        <div style={{ display: 'flex' }}>
          <IconButton
            aria-label={isVisible ? '收起设置' : '展开设置'}
            onClick={() => setIsVisible((visible) => !visible)}
            color={isVisible ? 'info' : 'inherit'}
          >
            <SettingsIcon />
          </IconButton>
          {isVisible && (
            <>
              <Typography
                variant="h4"
                component="span"
                sx={{ marginLeft: 'auto', marginRight: 'auto' }}
              >
                设置
              </Typography>
            </>
          )}
        </div>
        {isVisible ? (
          <>
            <Chip
              label={`ECO ${dataMetadata.gameVersion}`}
              color="success"
              variant="outlined"
              sx={{ alignSelf: 'center', marginY: 1 }}
            />
            <Typography variant="caption" sx={{ textAlign: 'center' }}>
              官方原版数据：{dataMetadata.recipeCount.toLocaleString()} 条配方 ·{' '}
              {new Date(dataMetadata.sourceCommitDate).toLocaleDateString(
                'zh-CN',
              )}
            </Typography>
            <Button
              startIcon={<EditIcon />}
              onClick={() => setShowRecipeEditor(true)}
              sx={{ marginY: 1 }}
            >
              配方编辑器
            </Button>
            <RecipeEditorDialog
              open={showRecipeEditor}
              recipes={activeProfile.data}
              customRecipes={activeProfile.customRecipes}
              dispatch={dispatch}
              onClose={() => setShowRecipeEditor(false)}
            />
            <FlexItem>
              <Button
                component="a"
                href={window.URL.createObjectURL(
                  new Blob([JSON.stringify(activeProfile, replacer)]),
                )}
                download="eco-cost-calculator-profile.json"
              >
                导出方案
              </Button>
              <label htmlFor="import-profile-button">
                <Input
                  accept="application/json"
                  type="file"
                  multiple
                  id="import-profile-button"
                  onChange={(event) => {
                    const reader = new FileReader();
                    const file = event.target.files?.[0];
                    console.log(event.target.files);
                    if (!file) return;
                    reader.readAsText(file);

                    reader.onload = (evt) => {
                      dispatch({
                        type: ActionType.IMPORT_PROFILE,
                        profileString: evt.target?.result as string,
                      });
                    };
                    event.target.value = '';
                    event.target.files = null;
                  }}
                />
                <Button component="span" color="warning" fullWidth>
                  导入方案
                </Button>
              </label>
            </FlexItem>
            <FlexItem>
              <Typography component="span">方案名称</Typography>
              <TextField
                variant="outlined"
                margin="dense"
                size="small"
                inputProps={{ style: { textAlign: 'right' } }}
                onChange={(event) => setProfileName(event.target.value)}
                onBlur={() =>
                  dispatch({
                    type: ActionType.UPDATE_PROFILE_NAME,
                    newName: profileName || '',
                  })
                }
                value={profileName}
                sx={{ width: 160 }}
              />
            </FlexItem>
            <FlexItem>
              <Typography component="span">利润率</Typography>
              <NumberInput
                value={activeProfile.margin * 100}
                onChange={(event) => {
                  const parsed = parseFloat(event.target.value);
                  dispatch({
                    type: ActionType.UPDATE_MARGIN,
                    newMargin: (parsed || 0) / 100,
                  });
                }}
                sx={{ width: 160 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">%</InputAdornment>
                  ),
                }}
              />
            </FlexItem>
            <FlexItem>
              <Typography component="span">每千卡成本</Typography>
              <NumberInput
                value={activeProfile.calorieCost}
                sx={{ width: 160 }}
                onChange={(event) => {
                  const parsed = parseFloat(event.target.value);
                  dispatch({
                    type: ActionType.UPDATE_CALORIE_COST,
                    newCost: parsed || 0,
                  });
                }}
              />
            </FlexItem>

            <FlexItem>
              <FormControlLabel
                label="显示危险操作"
                control={
                  <Checkbox
                    checked={showDangerousActions}
                    color="error"
                    onChange={() =>
                      setShowDangerousActions(!showDangerousActions)
                    }
                  />
                }
              />
            </FlexItem>

            {showDangerousActions && (
              <>
                上传新的 JSON 数据将重置全部技能、原料和产品。
                <label htmlFor="contained-button-file">
                  <Input
                    accept="application/json"
                    type="file"
                    onChange={(event) => {
                      const reader = new FileReader();
                      const file = event.target.files?.[0];
                      if (!file) return;
                      reader.readAsText(file);

                      reader.onload = (evt) => {
                        dispatch({
                          type: ActionType.UPLOAD_DATA_JSON,
                          data: evt.target?.result as string,
                        });
                      };
                      event.target.value = '';
                      event.target.files = null;
                    }}
                  />
                  <Button component="span" color="warning" fullWidth>
                    上传数据 JSON
                  </Button>
                </label>
                <Divider />
                删除当前方案。此操作无法撤销。
                <Button
                  color="error"
                  onClick={() => {
                    if (profiles.size === 1) return;
                    dispatch({ type: ActionType.DELETE_ACTIVE_PROFILE });
                  }}
                >
                  删除方案
                </Button>
              </>
            )}
          </>
        ) : (
          <>
            <Typography variant="caption">
              ECO {dataMetadata.gameVersion}
            </Typography>
            <Typography>{activeProfile.margin * 100}%</Typography>
            <Typography>{activeProfile.calorieCost}/千卡</Typography>
          </>
        )}
      </Stack>
    </Paper>
  );
};
