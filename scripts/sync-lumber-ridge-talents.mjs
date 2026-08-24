import fs from 'node:fs';
import path from 'node:path';

const sourceArg = process.argv.find((value) => value.startsWith('--source='));
if (!sourceArg) {
  throw new Error(
    'Usage: node scripts/sync-lumber-ridge-talents.mjs --source=<extracted mod directory>',
  );
}

const sourceRoot = path.resolve(sourceArg.slice('--source='.length));
const perksRoot = fs.existsSync(path.join(sourceRoot, 'LumbridgeOverhaulPerks'))
  ? path.join(sourceRoot, 'LumbridgeOverhaulPerks')
  : sourceRoot;
const outputPath = path.resolve('src/data/lumber-ridge-talents.json');
const supportedActions = new Set([
  'ResourceCost',
  'LaborCost',
  'CraftTime',
  'Yield',
]);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function balanced(source, openingIndex, open = '{', close = '}') {
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = openingIndex; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') quoted = false;
      continue;
    }
    if (character === '"') {
      quoted = true;
      continue;
    }
    if (character === open) depth += 1;
    if (character === close) depth -= 1;
    if (depth === 0) return source.slice(openingIndex, index + 1);
  }
  throw new Error(`Unbalanced ${open}${close} block`);
}

function unescapeCSharp(value) {
  return value.replace(/\\n/g, ' ').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
}

function parseNumber(source, field) {
  const match = source.match(
    new RegExp(`${field}\\s*(?:=|:)\\s*(-?\\d+(?:\\.\\d+)?)f?`, 'i'),
  );
  return match ? Number(match[1]) : undefined;
}

function typeNames(source, field) {
  const match = source.match(
    new RegExp(
      `${field}\\s*=\\s*new HashSet<[^>]+>\\s*\\{([\\s\\S]*?)\\}`,
      'i',
    ),
  );
  return match
    ? [...match[1].matchAll(/typeof\((\w+)\)/g)].map((item) => item[1])
    : undefined;
}

function stringNames(source, field) {
  const match = source.match(
    new RegExp(
      `${field}\\s*=\\s*new HashSet<string>\\s*\\{([\\s\\S]*?)\\}`,
      'i',
    ),
  );
  return match
    ? [...match[1].matchAll(/"((?:\\.|[^"])*)"/g)].map((item) =>
        unescapeCSharp(item[1]),
      )
    : undefined;
}

function compact(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => {
      if (value == null) return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }),
  );
}

function filters(source) {
  return compact({
    recipeNames: typeNames(source, 'Recipes'),
    itemTags: stringNames(source, 'ItemTags'),
    skillTypes: typeNames(source, 'SkillTypes'),
    excludedSkillTypes: typeNames(source, 'ExcludedSkillTypes'),
    craftingStationTypes: typeNames(source, 'CraftStationTypes'),
  });
}

function parseDirectBonuses(talentBlock) {
  const bonuses = [];
  const marker = 'this.Bonuses.Add(new Bonus';
  let cursor = 0;
  while ((cursor = talentBlock.indexOf(marker, cursor)) >= 0) {
    const opening = talentBlock.indexOf('{', cursor + marker.length);
    const block = balanced(talentBlock, opening);
    cursor = opening + block.length;
    const action = block.match(/BonusAction\.(\w+)/)?.[1];
    if (!action || !supportedActions.has(action)) continue;
    const effectPattern =
      /new BonusEffect(Additive|CappedMultiplicative|Multiplicative)\s*\{/g;
    for (const effectMatch of block.matchAll(effectPattern)) {
      const effectOpening = effectMatch.index + effectMatch[0].lastIndexOf('{');
      const effectBlock = balanced(block, effectOpening);
      const value = parseNumber(effectBlock, 'Value');
      if (value == null) continue;
      bonuses.push(
        compact({
          action,
          effectType: effectMatch[1],
          value,
          cap: parseNumber(effectBlock, 'Cap'),
          ...filters(block),
        }),
      );
    }
  }
  return bonuses;
}

function parseHelperBonuses(talentBlock) {
  const marker = 'AddCostLaborTimeSpecialty(';
  const markerIndex = talentBlock.indexOf(marker);
  if (markerIndex < 0) return null;
  const opening = talentBlock.indexOf('(', markerIndex);
  const call = balanced(talentBlock, opening, '(', ')');
  const skillName = call.match(/typeof\((\w+Skill)\)/)?.[1];
  if (!skillName) return null;
  const explicitDiscount = parseNumber(call, 'resourceDiscount');
  const variant = /isVariantSpecialization\s*:\s*true/i.test(call);
  const resourceDiscount = (explicitDiscount ?? 0.1) + (variant ? 0.02 : 0);
  const maxLevel = parseNumber(call, 'numberOfLevels') ?? 5;
  const resourceFilters = filters(call);
  return {
    maxLevel,
    bonuses: [
      compact({
        action: 'ResourceCost',
        effectType: 'CappedMultiplicative',
        value: 1 - resourceDiscount,
        cap: 1 - resourceDiscount * maxLevel,
        ...resourceFilters,
        skillTypes: [skillName],
      }),
      {
        action: 'LaborCost',
        effectType: 'CappedMultiplicative',
        value: 1.05,
        cap: 1.25,
        skillTypes: [skillName],
      },
      {
        action: 'CraftTime',
        effectType: 'CappedMultiplicative',
        value: 1.05,
        cap: 1.25,
        skillTypes: [skillName],
      },
    ],
  };
}

function inferMaxLevel(groupBlock, bonuses) {
  const explicit = groupBlock.match(
    /MaxTalentLevel\s*\{\s*get\s*=>\s*(\d+)/,
  )?.[1];
  if (explicit) return Number(explicit);
  const inferred = bonuses
    .filter(
      (bonus) =>
        bonus.effectType === 'CappedMultiplicative' &&
        bonus.cap != null &&
        bonus.value !== 1,
    )
    .map((bonus) => Math.round(Math.abs((bonus.cap - 1) / (bonus.value - 1))))
    .filter((level) => Number.isFinite(level) && level > 0);
  return inferred.length ? Math.max(...inferred) : 1;
}

function parseTalentFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relative = path.relative(perksRoot, filePath).replace(/\\/g, '/');
  if (relative.startsWith('Shared/') || relative.startsWith('Overrides/'))
    return [];
  const talents = [];
  const groupPattern =
    /\[LocDisplayName\("((?:\\.|[^"])*)"\)\]\s*\[LocDescription\("((?:\\.|[^"])*)"\)\]\s*public partial class (\w+TalentGroup)\s*:\s*\w+/g;
  for (const groupMatch of content.matchAll(groupPattern)) {
    const groupOpening = content.indexOf(
      '{',
      groupMatch.index + groupMatch[0].length,
    );
    const groupBlock = balanced(content, groupOpening);
    const talentName = groupBlock.match(/typeof\((\w+Talent)\)/)?.[1];
    const skillName = groupBlock.match(
      /OwningSkill\s*=\s*typeof\((\w+Skill)\)/,
    )?.[1];
    if (!talentName || !skillName) continue;
    const talentDeclaration = new RegExp(
      `public partial class ${talentName}\\s*:\\s*Talent`,
    ).exec(content);
    if (!talentDeclaration) continue;
    const talentOpening = content.indexOf(
      '{',
      talentDeclaration.index + talentDeclaration[0].length,
    );
    const talentBlock = balanced(content, talentOpening);
    const helper = parseHelperBonuses(talentBlock);
    const bonuses = helper?.bonuses ?? parseDirectBonuses(talentBlock);
    if (bonuses.length === 0) continue;
    const unlockLevel = Number(
      groupBlock.match(/this\.Level\s*=\s*(\d+)/)?.[1] ?? 0,
    );
    talents.push({
      name: talentName,
      groupName: groupMatch[3],
      displayName: unescapeCSharp(groupMatch[1]),
      description: unescapeCSharp(groupMatch[2]),
      skillName,
      unlockLevel,
      maxLevel: helper?.maxLevel ?? inferMaxLevel(groupBlock, bonuses),
      sourceFile: relative,
      bonuses,
    });
  }
  return talents;
}

function researchTalents() {
  const specialistSource = fs.readFileSync(
    path.join(perksRoot, 'Shared', 'LumbridgePerks_Specialist.cs'),
    'utf8',
  );
  const skills = [
    ...specialistSource.matchAll(/AddSpecialistBonuses<(\w+Skill)>/g),
  ].map((match) => match[1]);
  return skills.flatMap((skillName) => [
    {
      name: `${skillName}ResearchSpecialistTalent`,
      groupName: `${skillName}ResearchSpecialistTalentGroup`,
      choiceGroup: `${skillName}:ResearchApproach`,
      displayName: `Specialist (${skillName.replace(/Skill$/, '')})`,
      localizedName: '研究专精',
      description: '本职业研究论文材料降低 30%，全部研究论文材料增加 5%。',
      skillName,
      unlockLevel: 7,
      maxLevel: 1,
      sourceFile: 'Shared/LumbridgePerks_Specialist.cs',
      bonuses: [
        {
          action: 'ResourceCost',
          effectType: 'Multiplicative',
          value: 0.7,
          itemTags: ['Research'],
          skillTypes: [skillName],
        },
        {
          action: 'ResourceCost',
          effectType: 'Multiplicative',
          value: 1.05,
          itemTags: ['Research'],
          craftingStationTypes: ['ResearchTableObject'],
        },
      ],
    },
    {
      name: `${skillName}ResearchUniversalistTalent`,
      groupName: `${skillName}ResearchUniversalistTalentGroup`,
      choiceGroup: `${skillName}:ResearchApproach`,
      displayName: `Jack of all Trades (${skillName.replace(/Skill$/, '')})`,
      localizedName: '研究通才',
      description: '全部研究论文材料降低 5%，制作时间增加 50%。',
      skillName,
      unlockLevel: 7,
      maxLevel: 1,
      sourceFile: 'Shared/LumbridgePerks_Universalist.cs',
      bonuses: [
        {
          action: 'ResourceCost',
          effectType: 'Multiplicative',
          value: 0.95,
          itemTags: ['Research'],
        },
        {
          action: 'CraftTime',
          effectType: 'Multiplicative',
          value: 1.5,
          itemTags: ['Research'],
        },
      ],
    },
    {
      name: `${skillName}ResearchPragmatistTalent`,
      groupName: `${skillName}ResearchPragmatistTalentGroup`,
      choiceGroup: `${skillName}:ResearchApproach`,
      displayName: `Practically Minded (${skillName.replace(/Skill$/, '')})`,
      localizedName: '实用主义研究者',
      description: '本职业全部配方材料降低 10%，本职业研究论文材料增加 100%。',
      skillName,
      unlockLevel: 7,
      maxLevel: 1,
      sourceFile: 'Shared/LumbridgePerks_Pragmatist.cs',
      bonuses: [
        {
          action: 'ResourceCost',
          effectType: 'Multiplicative',
          value: 0.9,
          skillTypes: [skillName],
        },
        {
          action: 'ResourceCost',
          effectType: 'Multiplicative',
          value: 2,
          itemTags: ['Research'],
          skillTypes: [skillName],
        },
      ],
    },
  ]);
}

const talents = walk(perksRoot)
  .filter((filePath) => filePath.endsWith('.cs'))
  .flatMap(parseTalentFile)
  .concat(researchTalents())
  .sort(
    (left, right) =>
      left.skillName.localeCompare(right.skillName) ||
      left.unlockLevel - right.unlockLevel ||
      left.displayName.localeCompare(right.displayName),
  );

const output = {
  metadata: {
    modId: 6236983,
    fileId: 8119470,
    version: '1.0.5',
    sourceUrl: 'https://mod.io/g/eco/m/lumber-ridge-profession-perk-rework',
    generatedAt: new Date().toISOString(),
    talentCount: talents.length,
    skillCount: new Set(talents.map((talent) => talent.skillName)).size,
  },
  talents,
};

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(
  `Wrote ${talents.length} calculator-relevant talents to ${outputPath}`,
);
