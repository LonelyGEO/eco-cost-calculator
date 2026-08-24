import rawTalentData from './lumber-ridge-talents.json';
import { Bonus } from './recipes';

export interface LumberRidgeTalent {
  name: string;
  groupName: string;
  choiceGroup?: string;
  displayName: string;
  localizedName?: string;
  description: string;
  skillName: string;
  unlockLevel: number;
  maxLevel: number;
  sourceFile: string;
  bonuses: Bonus[];
}

export interface LumberRidgeMetadata {
  modId: number;
  fileId: number;
  version: string;
  sourceUrl: string;
  generatedAt: string;
  talentCount: number;
  skillCount: number;
}

interface LumberRidgeData {
  metadata: LumberRidgeMetadata;
  talents: LumberRidgeTalent[];
}

const data = rawTalentData as LumberRidgeData;

export const lumberRidgeMetadata = data.metadata;
export const lumberRidgeTalents = data.talents;
export const lumberRidgeTalentsBySkill = new Map<string, LumberRidgeTalent[]>();

lumberRidgeTalents.forEach((talent) => {
  const talents = lumberRidgeTalentsBySkill.get(talent.skillName) ?? [];
  talents.push(talent);
  lumberRidgeTalentsBySkill.set(talent.skillName, talents);
});

const localizedTalentNames: Record<string, string> = {
  'Pizza Hater': '拒绝披萨',
  'Pizza Lover': '披萨爱好者',
  "Carnivore's Delight": '肉食盛宴',
  "Herbivore's Delight": '素食盛宴',
  'Spicy Supper': '香辣晚餐',
  'Sushi Special': '寿司专精',
  'Seaside Specialty': '海滨石材专精',
  'Subterranean Specialty': '地下石材专精',
  'Hanging down': '悬挂标牌',
  "Mason's Touch": '石匠之触',
  'Standing up': '立式标牌',
  'Fancy Fountains': '精美喷泉',
  'Drummed Up': '桶装专家',
  'Full Bore': '钢管专精',
  'Heavy Metal': '重型钢材',
  'Built to Last': '经久耐用',
  'Coiled Steel': '卷簧钢',
  'Red-Hot Rivets': '炽热铆钉',
  'Ripple Effect': '波纹效应',
  'Golden Roast': '黄金烘烤',
  'Perfect Knead': '完美揉面',
  'Roasted Roots': '烘烤根茎',
  "Baker's Dozen": '面包师的一打',
  'Perfect Pastry': '完美糕点',
  Wainwright: '车辆工匠',
  Waterwright: '水力工匠',
  Windwright: '风力工匠',
  'Smooth Passage': '平坦通途',
  'Stone by Stone': '积石成路',
  'Activated Carbon': '活性炭',
  'Hidden Attraction': '隐秘引力',
  'Cutting Edge': '锋刃工艺',
  'Nailed It': '一锤定钉',
  'Precision Machining': '精密加工',
  'Village Smith': '乡村铁匠',
  'Factory Floor': '工厂产线',
  'Home & Hearth': '家园与炉火',
  'Big Game': '大型猎物',
  'Great Game': '巨型猎物',
  'Small Game': '小型猎物',
  'Pulled Apart': '精细拆解',
  'Well Lubricated': '润滑充分',
  'Off Cuts': '边角肉料',
  'Quality Cuts': '优质分割',
  'Crisp & Tender': '外脆里嫩',
  'Slow Simmer': '慢火炖煮',
  'Woodland Greens': '林间蔬食',
  'Slow Rendering': '慢炼脂油',
  'Lumber Construction': '木材建造',
  'Lumber Fabrication': '木材制造',
  'Overflowing Silos': '满仓粮筒',
  'Overflowing Stacks': '满载堆栈',
  'Composite Construction': '复合材料建造',
  'Composite Fabrication': '复合材料制造',
  'Berry Blessed': '莓果馈赠',
  'Garden Variety': '田园百味',
  'Gentle Simmer': '文火慢炖',
  'Bone to Broth': '骨熬高汤',
  'Root to Stem': '物尽其用',
  'Quick Bite': '快捷餐点',
  'Slow Boil': '慢火煮汤',
  'Bright Ideas': '灵光巧思',
  Electrification: '电气化',
  'Silicon Specialist': '硅材专家',
  'Green Energy': '绿色能源',
  'Light the Way': '照亮前路',
  'Autumn Woods': '秋日林地',
  'Boreal Blessing': '寒林赐福',
  'Endless Prairie': '无垠草原',
  'Jungle Bounty': '丛林丰收',
  'Misty Marsh': '雾隐湿地',
  'Seeds of Plenty': '丰饶种子',
  'Seed Saver': '惜种如金',
  'Garden Store': '园艺商店',
  'BlackPowder Specialty': '黑火药专精',
  'Fertilizers Specialty': '化肥专精',
  'Filler Yield': '填充增产',
  'Clay Shaper': '黏土塑形师',
  'Cotton Gin': '轧棉专家',
  'Flax Spinner': '亚麻纺工',
  Glassblowing: '玻璃吹制',
  Glassware: '玻璃器皿',
  Glazing: '玻璃装配',
  'Bright Idea': '明亮创意',
  'Strong Stuff': '强化玻璃',
  'Fresh Catch': '鲜活捕获',
  'Silent Snares': '无声陷阱',
  'Sure Catch': '稳操胜券',
  'Cabinet Works': '橱柜工艺',
  'Coach Works': '车体工艺',
  'Industrial Machinery': '工业机械',
  'Hard Hand': '刚劲手法',
  'Skilled Hands': '巧手匠人',
  'Soft Touch': '柔和手法',
  'Steady Hands': '沉稳双手',
  Moldwright: '模具工匠',
  'Straight Grain': '顺直木纹',
  'Architectural Stone': '建筑石材',
  'Decorative Stone': '装饰石材',
  'Mortar Mixing': '砂浆调配',
  'Concrete Casting': '混凝土浇筑',
  'Keep it dry': '保持干燥',
  'Make it whet': '磨砺锋刃',
  'Agricultural Implements': '农业器械',
  Machinist: '机械加工师',
  'Steam Power': '蒸汽动力',
  'Flour Power': '面粉之力',
  'Sweet Tooth': '嗜甜如命',
  'Well-Oiled Machine': '运转顺滑',
  'Food-Safe Workshop': '食品级工坊',
  'Non-Food-Grade Workshop': '工业级工坊',
  'Dig Deep': '深入开采',
  'Gold Rush': '淘金热',
  'Iron Specialty': '铁矿专精',
  'Quarry Master': '采石大师',
  'Work Smarter': '巧干为先',
  'Get Your Hands Dirty': '亲手钻探',
  'Keep Your Hands Clean': '洁净精炼',
  Filaments: '纤维丝材',
  Gels: '凝胶专精',
  Polymers: '聚合物专精',
  Solutions: '溶液专精',
  'Farm to Fuel': '农产燃料',
  'Pump to Petrol': '原油制汽油',
  'Brush & Barrel': '画笔与漆桶',
  'Colors of the Wind': '风中之色',
  'Pen & Press': '笔与印刷机',
  'Art Studio': '艺术工作室',
  'Print Shop': '印刷工坊',
  'Cheap Fibers': '低成本纤维',
  'Paper Creations': '纸艺创作',
  'Perfect Press': '完美压制',
  'Sealed Sheets': '密封纸张',
  'Brick Moulding': '砖坯塑形',
  Earthenwares: '陶土器皿',
  'Kiln-Fired': '窑火烧制',
  'Back to Earth': '回归泥土',
  'Second Stitch': '二次缝制',
  'Back in the Mill': '重回纺机',
  'Back to the Forge': '重回熔炉',
  'Drawn Again': '再次拉制',
  'Second Mint': '二次铸币',
  'Proof Positive': '再生提纯',
  Boatwright: '造船工匠',
  Hullwright: '船体工匠',
  'Hammer and Rivet': '锤与铆钉',
  'True Joinery': '精密榫接',
  Ironclad: '铁甲船体',
  'Forge Fire': '锻造之火',
  'Foundry Fire': '铸造之火',
  'Cast in Iron': '铁铸成型',
  'Common Cloth': '普通织物',
  'Fine Linen': '精制亚麻',
  'Fine Upholstery': '精细软装',
  'Perfect Fit': '完美合身',
  'Horizontally inclined': '水平专精',
};

export function getLumberRidgeTalentLabel(talent: LumberRidgeTalent): string {
  return (
    talent.localizedName ??
    localizedTalentNames[talent.displayName] ??
    talent.displayName
  );
}

function signedPercent(value: number): string {
  const rounded = Math.round(value * 1000) / 10;
  return `${rounded > 0 ? '+' : ''}${rounded}%`;
}

const actionLabels: Record<Bonus['action'], string> = {
  ResourceCost: '材料',
  LaborCost: '劳动力',
  CraftTime: '制作时间',
  Yield: '产量',
};

export function describeLumberRidgeTalent(talent: LumberRidgeTalent): string {
  const effects = talent.bonuses.map((bonus) => {
    const effect =
      bonus.effectType === 'Additive'
        ? `${bonus.value > 0 ? '+' : ''}${bonus.value}`
        : signedPercent(bonus.value - 1);
    const cap =
      bonus.effectType === 'CappedMultiplicative' && bonus.cap != null
        ? `，封顶 ${signedPercent(bonus.cap - 1)}`
        : '';
    const scope = bonus.recipeNames?.length
      ? `，指定配方 ${bonus.recipeNames.length} 个`
      : bonus.itemTags?.length
      ? `，标签：${bonus.itemTags.join('、')}`
      : bonus.craftingStationTypes?.length
      ? `，指定制作站`
      : '';
    return `${actionLabels[bonus.action]} ${effect}${cap}${scope}`;
  });
  return effects.join('；');
}

export function getLumberRidgeTalentsForSkill(
  skillName: string,
): LumberRidgeTalent[] {
  return lumberRidgeTalentsBySkill.get(skillName) ?? [];
}
