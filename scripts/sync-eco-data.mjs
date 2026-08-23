import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataDirectory = resolve(repositoryRoot, 'src', 'data');
const sourceRepository = 'Eco-Gnome/eco-gnome-website';
const sourcePath = 'ecocraft/eco_gnome_data.json';
const sourceUrl = `https://raw.githubusercontent.com/${sourceRepository}/master/${sourcePath}`;
const commitApiUrl = `https://api.github.com/repos/${sourceRepository}/commits?path=${encodeURIComponent(sourcePath)}&per_page=1`;
const gameVersion = process.argv.find((argument) => argument.startsWith('--game-version='))?.split('=')[1] ?? '14.0.3';

// Update 14 introduced names that are still English in the upstream zh-Hans
// catalog. Keep the small reviewed supplement here so regenerated data remains
// fully Chinese while upstream translations can replace it automatically later.
const manualChinese = {
  'Deeper Pockets: Self Improvement': '更深的口袋：自我提升',
  'Glutton: Self Improvement': '大胃王：自我提升',
  'Nature Adventurer: Self Improvement': '自然探险家：自我提升',
  'Urban Traveller: Self Improvement': '城市旅行者：自我提升',
  'Abundant: Advanced Baking': '丰盛：高级烘焙',
  'Fruit Centric: Advanced Baking': '水果中心：高级烘焙',
  'Stuff It: Advanced Baking': '填馅：高级烘焙',
  'Top It: Advanced Baking': '加料：高级烘焙',
  'Fully Staffed: Advanced Cooking': '人手齐备：高级烹饪',
  'Ina Bowl: Advanced Cooking': '装进碗里：高级烹饪',
  'Refined Scraps: Advanced Cooking': '精炼边角料：高级烹饪',
  'Take Out: Advanced Cooking': '外带：高级烹饪',
  'Coastal Rock: Advanced Masonry': '海岸岩石：高级石工',
  'Sharp Blades: Advanced Masonry': '锋利刀刃：高级石工',
  'Smooth Stone: Advanced Masonry': '光滑石材：高级石工',
  'Sub Terrain Sourced: Advanced Masonry': '地下取材：高级石工',
  'Carbon Enrichment: Advanced Smelting': '碳富集：高级冶炼',
  'Metallurgy Improvements: Advanced Smelting': '冶金改进：高级冶炼',
  'Rolling Steel: Advanced Smelting': '轧制钢材：高级冶炼',
  'Steel Processing: Advanced Smelting': '钢材加工：高级冶炼',
  'Roadworks: Basic Engineering': '道路工程：基础工程',
  'Vehicular Design: Basic Engineering': '车辆设计：基础工程',
  'Wateristheway: Basic Engineering': '水即是道：基础工程',
  'Windequalsenergy: Basic Engineering': '风即是能：基础工程',
  'Roasted: Campfire Cooking': '炙烤：篝火烹饪',
  'Side Dishes: Campfire Cooking': '配菜：篝火烹饪',
  'Stew Gourmand: Campfire Cooking': '炖菜美食家：篝火烹饪',
  'Using Scraps: Campfire Cooking': '利用边角料：篝火烹饪',
  'Focused Workflow: Cutting Edge Cooking': '专注工作流：尖端烹饪',
  'Frugal Workspace: Cutting Edge Cooking': '节俭工作空间：尖端烹饪',
  'Lavish Workspace: Cutting Edge Cooking': '豪华工作空间：尖端烹饪',
  'Parallel Processing: Cutting Edge Cooking': '并行处理：尖端烹饪',
  'Crude Refining: Oil Drilling': '原油精炼：石油钻探',
  'Fuel Focus: Oil Drilling': '专注燃料：石油钻探',
  'Improved Extraction: Oil Drilling': '改进开采：石油钻探',
  'Synthetic Materials: Oil Drilling': '合成材料：石油钻探',
  'Focused Workflow: Paper Milling': '专注工作流：造纸',
  'Frugal Workspace: Paper Milling': '节俭工作空间：造纸',
  'Lavish Workspace: Paper Milling': '豪华工作空间：造纸',
  'Parallel Processing: Paper Milling': '并行处理：造纸',
  Adobe: '土坯',
  Dowel: '木销',
  'Gathering Research Paper Advanced': '高级采集研究论文',
  Fuse: '保险丝',
  'Agriculture Research Paper Basic': '基础农业研究论文',
  'Clay Mold': '黏土模具',
  Daisy: '雏菊',
  'Daisy Seed': '雏菊种子',
  Magnet: '磁铁',
  Ink: '墨水',
  Sulfurcrete: '硫磺混凝土',
  'Sweet Jerky': '甜味肉干',
  'Reprocess Dry Tailings': '再处理干尾矿',
  Paraffin: '石蜡',
  'Reprocess Wet Tailings': '再处理湿尾矿',
  'Synthetic Phosphate Fertilizer': '合成磷肥',
  'Processed Creosote': '加工杂酚油',
  Whetstone: '磨刀石',
  'Rice Mortar': '米砂浆',
  'Bio Gasoline': '生物汽油',
  'Dendrology Research Paper Advanced Hull Planks': '高级树木学研究论文：船壳板',
  'Dissolve Electronic Scrap': '溶解电子废料',
  'Dry Fish': '鱼干',
  Wax: '蜡',
  'Crushed Coal Lv2': '二级碎煤',
  'Adobe Door': '土坯门',
  Scorpion: '蝎子',
  'Iron Road Tool': '铁制道路工具',
  'Hare Pelt': '野兔毛皮',
  'Fox Pelt': '狐狸毛皮',
  'Iron Frame Wide': '宽铁框',
  Kite: '风筝',
  'Steel Bin': '钢制垃圾箱',
  'Cotton Streamer Stars': '星纹棉布彩带',
  Chandelier: '吊灯',
  Orrery: '太阳系仪',
  Grindstone: '砂轮',
  Dynamite: '炸药',
  'Tiki Torch': '提基火炬',
  'Elk Gong': '麋鹿锣',
  'Stump Table': '树桩桌',
  Tapestry: '挂毯',
  'Tapestry Fish': '鱼纹挂毯',
  'Shoji Door': '障子门',
  'Tailor Sign': '裁缝招牌',
  Peat: '泥炭',
  Rose: '玫瑰',
  Sulfur: '硫',
  Tulip: '郁金香',
};

async function getJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'eco-cost-calculator-data-sync',
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to download ${url}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function localizedName(value) {
  const english = value?.['en-US'] ?? '';
  const upstreamChinese = value?.['zh-Hans'] ?? english;
  const chinese =
    upstreamChinese && upstreamChinese !== english
      ? upstreamChinese
      : manualChinese[english] ?? upstreamChinese;
  return { english, chinese };
}

function compactBonus(bonus) {
  return {
    action: bonus.Action,
    effectType: bonus.EffectType,
    value: bonus.Value,
    ...(bonus.Cap == null ? {} : { cap: bonus.Cap }),
    ...(bonus.SkillTypes?.length ? { skillTypes: bonus.SkillTypes } : {}),
    ...(bonus.ExcludedSkillTypes?.length
      ? { excludedSkillTypes: bonus.ExcludedSkillTypes }
      : {}),
    ...(bonus.ItemTags?.length ? { itemTags: bonus.ItemTags } : {}),
  };
}

function compactDynamicValue(dynamicValue) {
  return {
    baseValue: dynamicValue?.BaseValue ?? 0,
    modifiers: (dynamicValue?.Modifiers ?? []).map((modifier) => ({
      dynamicType: modifier.DynamicType,
      ...(modifier.Item ? { item: modifier.Item } : {}),
      ...(modifier.ValueType ? { valueType: modifier.ValueType } : {}),
    })),
  };
}

function addTranslation(translations, value) {
  const { english, chinese } = localizedName(value);
  if (!english || !chinese || english === chinese) return;
  translations[english] = chinese;
}

const [source, commits] = await Promise.all([getJson(sourceUrl), getJson(commitApiUrl)]);
const sourceCommit = commits[0];
const itemsByName = new Map(source.Items.map((item) => [item.Name, item]));
const tagsByName = new Map(source.Tags.map((tag) => [tag.Name, tag]));
const productTagsByItem = new Map();

for (const tag of source.Tags) {
  for (const itemName of tag.AssociatedItems ?? []) {
    const tags = productTagsByItem.get(itemName) ?? [];
    tags.push(tag.Name);
    productTagsByItem.set(itemName, tags);
  }
}

const existingTranslationPath = resolve(dataDirectory, 'game-zh-cn.json');
const translations = JSON.parse(await readFile(existingTranslationPath, 'utf8'));

for (const collection of [source.Items, source.Tags, source.Skills, source.ModuleSlots]) {
  for (const entry of collection) addTranslation(translations, entry.LocalizedName);
}

for (const skill of source.Skills) {
  for (const talent of skill.Talents ?? []) {
    addTranslation(translations, talent.LocalizedName);
    addTranslation(translations, talent.LocalizedDescription);
  }
}

for (const recipe of source.Recipes) addTranslation(translations, recipe.LocalizedName);

function itemReference(itemOrTag) {
  const item = itemsByName.get(itemOrTag);
  const tag = tagsByName.get(itemOrTag);
  const sourceEntry = item ?? tag;
  const names = localizedName(sourceEntry?.LocalizedName);

  return {
    name: item ? itemOrTag : null,
    tag: tag ? itemOrTag : null,
    displayName: names.english || itemOrTag.replace(/Item$/, ''),
    localizedName: names.chinese || names.english || itemOrTag.replace(/Item$/, ''),
  };
}

const skills = source.Skills.map((skill) => {
  const names = localizedName(skill.LocalizedName);
  return {
    name: skill.Name,
    displayName: names.english,
    localizedName: names.chinese,
    profession: skill.Profession,
    maxLevel: skill.MaxLevel,
    laborReducePercent: skill.LaborReducePercent,
    talents: (skill.Talents ?? []).map((talent) => {
      const talentNames = localizedName(talent.LocalizedName);
      const description = localizedName(talent.LocalizedDescription);
      return {
        name: talent.Name,
        groupName: talent.TalentGroupName,
        displayName: talentNames.english,
        localizedName: talentNames.chinese,
        description: description.chinese || description.english,
        unlockLevel: talent.Level,
        maxLevel: talent.MaxLevel,
        bonuses: (talent.Bonuses ?? []).map(compactBonus),
      };
    }),
  };
});

const modules = source.Items.filter((item) => item.IsPluginModule && item.ModuleSlot).map(
  (item) => {
    const names = localizedName(item.LocalizedName);
    return {
      name: item.Name,
      displayName: names.english,
      localizedName: names.chinese,
      slot: item.ModuleSlot,
      bonuses: (item.ModuleBonuses ?? []).map(compactBonus),
    };
  },
);

const craftingTables = source.Items.filter((item) => item.IsCraftingTable).map((item) => {
  const names = localizedName(item.LocalizedName);
  return {
    name: item.Name,
    displayName: names.english,
    localizedName: names.chinese,
    moduleSlots: item.CraftingTableModuleSlots ?? [],
    pluginModules: item.CraftingTablePluginModules ?? [],
  };
});

const recipes = source.Recipes.map((recipe) => {
  const recipeNames = localizedName(recipe.LocalizedName);
  const ingredientNames = new Set(recipe.Ingredients.map((ingredient) => ingredient.ItemOrTag));
  const requiredSkill = source.Skills.find((skill) => skill.Name === recipe.RequiredSkill);
  const skillNames = localizedName(requiredSkill?.LocalizedName);
  const table = itemsByName.get(recipe.CraftingTable);
  const tableNames = localizedName(table?.LocalizedName);

  const ingredients = recipe.Ingredients.map((ingredient) => ({
    ...itemReference(ingredient.ItemOrTag),
    quantity: compactDynamicValue(ingredient.Quantity),
  }));

  const products = recipe.Products.map((product, index) => ({
    ...itemReference(product.ItemOrTag),
    name: product.ItemOrTag,
    tag: null,
    quantity: compactDynamicValue(product.Quantity),
    itemTags: productTagsByItem.get(product.ItemOrTag) ?? [],
    isRefund:
      (product.Quantity.BaseValue > 0 && ingredientNames.has(product.ItemOrTag)) ||
      (product.ItemOrTag === 'BarrelItem' && index > 0),
  }));

  return {
    name: recipe.Name,
    displayName: recipeNames.english || recipe.FamilyName || recipe.Name,
    localizedName: recipeNames.chinese || recipeNames.english || recipe.Name,
    familyName: recipe.FamilyName,
    isBlueprint: Boolean(recipe.IsBlueprint),
    isDefault: Boolean(recipe.IsDefault),
    craftingTable: recipe.CraftingTable,
    tableDisplayName: tableNames.english || recipe.CraftingTable.replace(/Item$/, ''),
    tableLocalizedName:
      tableNames.chinese || tableNames.english || recipe.CraftingTable.replace(/Item$/, ''),
    requiredSkill: recipe.RequiredSkill || '',
    skillDisplayName: skillNames.english || recipe.RequiredSkill?.replace(/Skill$/, '') || '通用',
    skillLocalizedName:
      skillNames.chinese || skillNames.english || recipe.RequiredSkill?.replace(/Skill$/, '') || '通用',
    requiredSkillLevel: recipe.RequiredSkillLevel ?? 0,
    labor: compactDynamicValue(recipe.Labor),
    craftMinutes: compactDynamicValue(recipe.CraftMinutes),
    ingredients,
    products,
  };
});

const compactData = {
  metadata: {
    gameVersion,
    schemaVersion: 1,
    upstreamSchemaVersion: source.Version,
    sourceRepository,
    sourcePath,
    sourceCommit: sourceCommit.sha,
    sourceCommitDate: sourceCommit.commit.committer.date,
    generatedAt: new Date().toISOString(),
    recipeCount: recipes.length,
    itemCount: source.Items.length,
    skillCount: skills.length,
    talentCount: skills.reduce((count, skill) => count + skill.talents.length, 0),
    moduleCount: modules.length,
  },
  skills,
  modules,
  craftingTables,
  recipes,
};

await mkdir(dataDirectory, { recursive: true });
await Promise.all([
  writeFile(
    resolve(dataDirectory, 'eco-data.json'),
    `${JSON.stringify(compactData)}\n`,
    'utf8',
  ),
  writeFile(
    existingTranslationPath,
    `${JSON.stringify(
      Object.fromEntries(Object.entries(translations).sort(([a], [b]) => a.localeCompare(b))),
      null,
      2,
    )}\n`,
    'utf8',
  ),
]);

console.log(
  `Generated ECO ${gameVersion} data: ${recipes.length} recipes, ${source.Items.length} items, ${skills.length} skills, ${modules.length} current modules.`,
);
console.log(`Source commit: ${sourceCommit.sha} (${sourceCommit.commit.committer.date})`);
