import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  List,
  ListItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React from 'react';
import { ItemDefinition, TagDefinition, itemsByName } from '../../data/recipes';
import { TagSelection, TagSelectionMode } from '../common/state/state';

interface TagSelectionDialogProps {
  open: boolean;
  tag: TagDefinition;
  selection?: TagSelection;
  onClose: () => void;
  onApply: (selection: TagSelection | null) => void;
}

function getCandidates(tag: TagDefinition): ItemDefinition[] {
  return tag.associatedItems
    .map((name) => itemsByName.get(name))
    .filter((item): item is ItemDefinition => Boolean(item))
    .sort((left, right) =>
      left.localizedName.localeCompare(right.localizedName, 'zh-CN'),
    );
}

function evenRatios(names: string[]): Record<string, number> {
  if (!names.length) return {};
  const base = Math.floor(10000 / names.length) / 100;
  const next = Object.fromEntries(names.map((name) => [name, base]));
  next[names[names.length - 1]] = Number(
    (100 - base * (names.length - 1)).toFixed(2),
  );
  return next;
}

export const TagSelectionDialog: React.FC<TagSelectionDialogProps> = ({
  open,
  tag,
  selection,
  onClose,
  onApply,
}) => {
  const candidates = React.useMemo(() => getCandidates(tag), [tag]);
  const [mode, setMode] = React.useState<TagSelectionMode>('cheapest');
  const [selected, setSelected] = React.useState<string[]>([]);
  const [ratios, setRatios] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    if (!open) return;
    setMode(selection?.mode ?? 'cheapest');
    setSelected(selection?.candidates.map(({ name }) => name) ?? []);
    setRatios(
      Object.fromEntries(
        selection?.candidates.map(({ name, ratio }) => [name, ratio]) ?? [],
      ),
    );
  }, [open, selection]);

  const ratioTotal = selected.reduce(
    (sum, name) => sum + (Number.isFinite(ratios[name]) ? ratios[name] : 0),
    0,
  );
  const invalidMix =
    mode === 'mix' && selected.length > 0 && Math.abs(ratioTotal - 100) > 0.01;

  const distributeEvenly = () => {
    if (!selected.length) return;
    setRatios(evenRatios(selected));
  };

  const toggle = (name: string) => {
    setSelected((current) => {
      const next = current.includes(name)
        ? current.filter((candidate) => candidate !== name)
        : [...current, name];
      if (mode === 'mix') setRatios(evenRatios(next));
      return next;
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>选择“{tag.localizedName}”可用材料</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <RadioGroup
            value={mode}
            onChange={(event) => {
              const nextMode = event.target.value as TagSelectionMode;
              setMode(nextMode);
              if (nextMode === 'mix' && Math.abs(ratioTotal - 100) > 0.01) {
                setRatios(evenRatios(selected));
              }
            }}
          >
            <FormControlLabel
              value="cheapest"
              control={<Radio />}
              label="自动使用所选材料中的最低成本项"
            />
            <FormControlLabel
              value="mix"
              control={<Radio />}
              label="按固定配比混合计算"
            />
          </RadioGroup>
          <Box>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Button
                size="small"
                onClick={() => {
                  const names = candidates.map(({ name }) => name);
                  setSelected(names);
                  if (mode === 'mix') setRatios(evenRatios(names));
                }}
              >
                全选
              </Button>
              <Button size="small" onClick={() => setSelected([])}>
                清空
              </Button>
              {mode === 'mix' && (
                <Button size="small" onClick={distributeEvenly}>
                  平均分配
                </Button>
              )}
            </Stack>
            <List disablePadding>
              {candidates.map((candidate) => {
                const checked = selected.includes(candidate.name);
                return (
                  <ListItem key={candidate.name} disableGutters>
                    <Checkbox
                      checked={checked}
                      onChange={() => toggle(candidate.name)}
                      inputProps={{
                        'aria-label': `选择${candidate.localizedName}`,
                      }}
                    />
                    <Typography sx={{ flex: 1 }}>
                      {candidate.localizedName}
                    </Typography>
                    {mode === 'mix' && checked && (
                      <TextField
                        label="占比 %"
                        type="number"
                        size="small"
                        value={ratios[candidate.name] ?? 0}
                        onChange={(event) =>
                          setRatios((current) => ({
                            ...current,
                            [candidate.name]: Number(event.target.value),
                          }))
                        }
                        inputProps={{ min: 0, max: 100, step: 1 }}
                        sx={{ width: 110 }}
                      />
                    )}
                  </ListItem>
                );
              })}
            </List>
          </Box>
          {mode === 'mix' && selected.length > 0 && (
            <Alert severity={invalidMix ? 'warning' : 'success'}>
              当前占比合计：{Number(ratioTotal.toFixed(2))}%
            </Alert>
          )}
          {!selected.length && (
            <Alert severity="info">
              提交空选择会恢复为直接填写“{tag.localizedName}”的市场单价。
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button
          variant="contained"
          disabled={invalidMix}
          onClick={() =>
            onApply(
              selected.length
                ? {
                    mode,
                    candidates: selected.map((name) => ({
                      name,
                      ratio: mode === 'mix' ? ratios[name] ?? 0 : 0,
                    })),
                  }
                : null,
            )
          }
        >
          应用
        </Button>
      </DialogActions>
    </Dialog>
  );
};
