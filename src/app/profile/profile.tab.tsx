import { Grid } from '@mui/material';
import React from 'react';
import { useActiveProfile, useProfiles } from '../common/state/state-provider';
import { Ingredients } from '../ingredients/ingredients.index';
import { Section } from '../layout/section';
import { Product } from '../products/products.index';
import { SkillSegment } from '../skills/skill-element';
import { Settings } from './settings';

export const ProfileTab: React.FC = () => {
  const { dispatch } = useProfiles();
  const activeProfile = useActiveProfile();
  const [showProfile, setShowProfile] = React.useState(false);

  if (!activeProfile) return null;
  return (
    <Grid
      container
      spacing={1}
      columns={{ xs: 1, md: 16 }}
      sx={{ padding: { xs: 1, md: 2 }, height: '100%' }}
    >
      <Grid item xs={1} md={showProfile ? 3 : 1}>
        <Settings isVisible={showProfile} setIsVisible={setShowProfile} />
      </Grid>
      <Grid item xs={1} md={showProfile ? 4 : 5}>
        <Section heading="技能与制作站">
          <SkillSegment
            dispatch={dispatch}
            craftingStations={activeProfile.craftingStations}
            professions={activeProfile.professions}
          />
        </Section>
      </Grid>
      <Grid item xs={1} md={showProfile ? 4 : 5}>
        <Section heading="原料">
          <Ingredients
            dispatch={dispatch}
            byproducts={activeProfile.byproducts}
            inputs={activeProfile.inputs}
            products={activeProfile.products}
            tagSelections={activeProfile.tagSelections}
          />
        </Section>
      </Grid>
      <Grid item xs={1} md={5}>
        <Section heading="产品">
          <Product
            dispatch={dispatch}
            data={activeProfile.data}
            products={activeProfile.products}
            recipes={activeProfile.recipes}
          />
        </Section>
      </Grid>
    </Grid>
  );
};
