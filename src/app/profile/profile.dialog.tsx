import React from 'react';
import Button from '@mui/material/Button';

import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Profile } from '../layout/content';

interface ProfileConfigProps {
  onClose: (profile?: Profile) => void;
  open: boolean;
  profile: Profile;
}

export const ProfileConfigDialog: React.FC<ProfileConfigProps> = ({
  onClose,
  profile,
  open,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: profile });

  const isNewProfile = profile.name === '';

  const onSubmit: SubmitHandler<Profile> = (data) => onClose(data);

  return (
    <Dialog open={open} onClose={() => onClose()} keepMounted={false}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{isNewProfile ? '新建方案' : '编辑方案'}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="方案名称"
            fullWidth
            variant="standard"
            error={Boolean(errors.name)}
            helperText={errors.name?.message}
            {...register('name')}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => onClose()}>取消</Button>
          <Button type="submit">
            {isNewProfile ? '创建方案' : '保存方案'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
