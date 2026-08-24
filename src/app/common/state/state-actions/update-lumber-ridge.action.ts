import { ProcessActionProps } from '../state';
import { markForUpdate, updatePrice } from '../update-prices';

interface UpdateLumberRidgeActionProps extends ProcessActionProps {
  enabled: boolean;
}

export const updateLumberRidgeAction = ({
  draft,
  enabled,
}: UpdateLumberRidgeActionProps) => {
  draft.lumberRidgeEnabled = enabled;
  draft.recipes.forEach((recipe) => markForUpdate({ draft, element: recipe }));
  draft.recipes.forEach((recipe) => updatePrice({ draft, element: recipe }));
};
