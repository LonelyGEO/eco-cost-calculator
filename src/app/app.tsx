import Grid from '@mui/material/Grid';
import React from 'react';
import {
  deserializeState,
  LOCAL_STORAGE_KEY,
  migrateLegacyState,
  standardProfiles,
} from './common/state/state';
import { ProfilesProvider } from './common/state/state-provider';
import { Content } from './layout/content';
import { Footer } from './layout/footer';
import { Header } from './layout/header';

export const App: React.FC = () => {
  const loadedState = React.useMemo(() => {
    const loaded = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (loaded) return deserializeState(loaded);

    const legacy = localStorage.getItem('appState');
    return legacy ? migrateLegacyState(legacy) : standardProfiles;
  }, []);

  return (
    <ProfilesProvider initialState={loadedState}>
      <Grid container justifyContent="stretch" direction="column">
        <Grid item>
          <Header />
        </Grid>
        <Grid item flexGrow={1}>
          <Content />
        </Grid>
        <Grid item>
          <Footer />
        </Grid>
      </Grid>
    </ProfilesProvider>
  );
};

export default App;
