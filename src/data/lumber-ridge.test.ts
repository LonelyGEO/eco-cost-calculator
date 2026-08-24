import {
  getLumberRidgeTalentLabel,
  getLumberRidgeTalentsForSkill,
  lumberRidgeMetadata,
  lumberRidgeTalents,
} from './lumber-ridge';

describe('Lumber Ridge 1.0.5 talent data', () => {
  it('contains every calculator-relevant profession rule parsed from the mod', () => {
    expect(lumberRidgeMetadata.version).toBe('1.0.5');
    expect(lumberRidgeMetadata.skillCount).toBe(32);
    expect(lumberRidgeMetadata.talentCount).toBe(252);
  });

  it('keeps the published Forge Fire values', () => {
    const forgeFire = getLumberRidgeTalentsForSkill('SmeltingSkill').find(
      (talent) => talent.displayName === 'Forge Fire',
    )!;
    const resourceBonus = forgeFire.bonuses.find(
      (bonus) => bonus.action === 'ResourceCost',
    )!;

    expect(forgeFire.maxLevel).toBe(8);
    expect(resourceBonus.value).toBeCloseTo(0.92);
    expect(resourceBonus.cap).toBeCloseTo(0.36);
    expect(resourceBonus.recipeNames).toEqual([
      'IronBarRecipe',
      'SmeltIronRecipe',
    ]);
  });

  it('provides all three mutually exclusive research approaches per skill', () => {
    const researchTalents = getLumberRidgeTalentsForSkill(
      'FarmingSkill',
    ).filter((talent) => talent.choiceGroup?.endsWith('ResearchApproach'));

    expect(researchTalents).toHaveLength(3);
    expect(
      new Set(researchTalents.map((talent) => talent.choiceGroup)).size,
    ).toBe(1);
  });

  it('provides a Chinese label for every displayed mod talent', () => {
    const untranslated = lumberRidgeTalents.filter(
      (talent) =>
        !talent.localizedName &&
        getLumberRidgeTalentLabel(talent) === talent.displayName,
    );

    expect(untranslated.map((talent) => talent.displayName)).toEqual([]);
  });
});
