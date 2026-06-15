import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Printer,
  Download,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Layout,
  Check,
  Sparkles,
  Languages,
  Eye,
  UtensilsCrossed,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMenuContext } from '@/contexts/MenuContext';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import type { Menu, Dish, Section } from '@/types';

/* ===================================================================
   EU 14 Allergens Definition — with colors, icons, keywords for auto-detect
   =================================================================== */
export interface AllergenDef {
  id: string;           // e.g. 'gluten'
  key: keyof Translations; // translation key
  number: number;       // 1-14
  color: string;        // brand color for the icon circle
  bgColor: string;      // background for highlighted cell
  icon: string;         // emoji/SVG letter or symbol
  symbol: string;       // clear print icon for poster templates
  /** Keywords (lowercase) used for auto-detection from dish name/description */
  keywords: string[];
  /** Full description shown in legend */
  descKey: keyof Translations;
}

const EU_ALLERGENS: AllergenDef[] = [
  {
    id: 'gluten', key: 'a1Name', number: 1, color: '#8B4513', bgColor: 'rgba(139,69,19,0.12)',
    icon: 'G', symbol: 'W', keywords: ['bread','flour','wheat','barley','rye','pasta','noodle','dumpling','beer','cake','cookie','pastry','crust','batter','breadcrumb','spelt','kamut','semolina','couscous','oat','malt'],
    descKey: 'a1Desc',
  },
  {
    id: 'crustaceans', key: 'a2Name', number: 2, color: '#E67E22', bgColor: 'rgba(230,126,34,0.12)',
    icon: 'C', symbol: 'Cr', keywords: ['shrimp','prawn','crab','lobster','crayfish','crustacean','scampi','crawfish','langoustine'],
    descKey: 'a2Desc',
  },
  {
    id: 'eggs', key: 'a3Name', number: 3, color: '#F39C12', bgColor: 'rgba(243,156,18,0.12)',
    icon: 'E', symbol: 'Eg', keywords: ['egg','mayonnaise','meringue','mousse','custard','hollandaise','béarnaise','albumen','yolk','white','omelet','omelette','quiche'],
    descKey: 'a3Desc',
  },
  {
    id: 'fish', key: 'a4Name', number: 4, color: '#2980B9', bgColor: 'rgba(41,128,185,0.12)',
    icon: 'F', symbol: 'Fi', keywords: ['fish','salmon','tuna','cod','bass','anchovy','sardine','mackerel','trout','haddock','plaice','fish sauce',' Worcester','roe','caviar','surimi'],
    descKey: 'a4Desc',
  },
  {
    id: 'peanuts', key: 'a5Name', number: 5, color: '#D35400', bgColor: 'rgba(211,84,0,0.12)',
    icon: 'P', symbol: 'Pn', keywords: ['peanut','groundnut','goober','arachis','nutella','nu-nut','peanut butter','satay sauce'],
    descKey: 'a5Desc',
  },
  {
    id: 'soybeans', key: 'a6Name', number: 6, color: '#27AE60', bgColor: 'rgba(39,174,96,0.12)',
    icon: 'S', symbol: 'So', keywords: ['soy','tofu','edamame','miso','soy sauce','tamari','tempeh','lecithin','soya','textured vegetable protein','tvp'],
    descKey: 'a6Desc',
  },
  {
    id: 'milk', key: 'a7Name', number: 7, color: '#3498DB', bgColor: 'rgba(52,152,219,0.12)',
    icon: 'M', symbol: 'Mk', keywords: ['milk','cream','butter','cheese','yogurt','lactose','casein','whey','curd','fromage','gouda','cheddar','parmesan','mozzarella','ricotta','feta','brie','camembert','condensed milk','evaporated milk'],
    descKey: 'a7Desc',
  },
  {
    id: 'nuts', key: 'a8Name', number: 8, color: '#C0392B', bgColor: 'rgba(192,57,43,0.12)',
    icon: 'N', symbol: 'Nt', keywords: ['almond','hazelnut','walnut','cashew','pecan','pistachio','brazil nut','macadamia','chestnut','pine nut','nut marzipan','gianduja','praline','nut oil','nut paste'],
    descKey: 'a8Desc',
  },
  {
    id: 'celery', key: 'a9Name', number: 9, color: '#82AA3F', bgColor: 'rgba(130,170,63,0.12)',
    icon: 'Ce', symbol: 'Ce', keywords: ['celery','celeriac','celery root','celery salt','celery seed','celery leaf'],
    descKey: 'a9Desc',
  },
  {
    id: 'mustard', key: 'a10Name', number: 10, color: '#F1C40F', bgColor: 'rgba(241,196,15,0.15)',
    icon: 'Mu', symbol: 'Mu', keywords: ['mustard','mustard seed','mustard powder','Dijon','whole grain mustard'],
    descKey: 'a10Desc',
  },
  {
    id: 'sesame', key: 'a11Name', number: 11, color: '#E74C3C', bgColor: 'rgba(231,76,60,0.12)',
    icon: 'Se', symbol: 'Se', keywords: ['sesame','tahini','sesame oil','sesame seed','halva','benne','gingelly'],
    descKey: 'a11Desc',
  },
  {
    id: 'sulfites', key: 'a12Name', number: 12, color: '#9B59B6', bgColor: 'rgba(155,89,182,0.12)',
    icon: 'Su', symbol: 'Su', keywords: ['sulfite','sulphite','sodium metabisulfite','wine','beer','dried fruit','vinegar','balsamic','preservative','E220','E221','E222','E223','E224','E225','E226','E227','E228','E229'],
    descKey: 'a12Desc',
  },
  {
    id: 'lupin', key: 'a13Name', number: 13, color: '#1ABC9C', bgColor: 'rgba(26,188,156,0.12)',
    icon: 'L', symbol: 'Lu', keywords: ['lupin','lupine','lupini bean','lupin flour','lupin seed'],
    descKey: 'a13Desc',
  },
  {
    id: 'molluscs', key: 'a14Name', number: 14, color: '#16A085', bgColor: 'rgba(22,160,133,0.12)',
    icon: 'Mo', symbol: 'Mo', keywords: ['mollusc','mollusk','squid','octopus','cuttlefish','snail','escargot','clam','oyster','mussel','scallop','abalone','cockle','whelk','ink'],
    descKey: 'a14Desc',
  },
];

/* Translation keys for allergen page */
interface Translations {
  pageTitle: string;
  pageSubtitle: string;
  productsContaining: string;
  print: string;
  noDishes: string;
  noDishesDesc: string;
  autoDetect: string;
  autoDetectDone: string;
  clearAll: string;
  styleClassic: string;
  styleBlackboard: string;
  styleWarm: string;
  styleModern: string;
  pageOf: string;
  /* Allergen 1-14 names */
  a1Name: string; a2Name: string; a3Name: string; a4Name: string;
  a5Name: string; a6Name: string; a7Name: string; a8Name: string;
  a9Name: string; a10Name: string; a11Name: string; a12Name: string;
  a13Name: string; a14Name: string;
  /* Allergen descriptions for legend */
  a1Desc: string; a2Desc: string; a3Desc: string; a4Desc: string;
  a5Desc: string; a6Desc: string; a7Desc: string; a8Desc: string;
  a9Desc: string; a10Desc: string; a11Desc: string; a12Desc: string;
  a13Desc: string; a14Desc: string;
  containsAllergens: string;
  editedNotice: string;
}

const ALLERGEN_TRANSLATIONS: Record<string, Translations> = {
  en: {
    pageTitle: 'ALLERGEN INFORMATION',
    pageSubtitle: 'Products or dishes containing allergens',
    productsContaining: 'PRODUCTS OR DISHES CONTAINING ALLERGENS',
    print: 'Print',
    noDishes: 'No dishes found',
    noDishesDesc: 'Add dishes to your menu first, then come back to generate this allergen chart.',
    autoDetect: 'Auto-detect allergens',
    autoDetectDone: 'Auto-detected!',
    clearAll: 'Clear all marks',
    styleClassic: 'Classic White',
    styleBlackboard: 'Black Board',
    styleWarm: 'Warm Beige',
    styleModern: 'Modern Blue',
    pageOf: 'Page {0} of {1}',
    a1Name: 'Gluten',     a2Name: 'Crustaceans', a3Name: 'Eggs',   a4Name: 'Fish',
    a5Name: 'Peanuts',    a6Name: 'Soybeans',    a7Name: 'Milk',   a8Name: 'Nuts (tree nuts)',
    a9Name: 'Celery',     a10Name: 'Mustard',     a11Name: 'Sesame', a12Name: 'Sulfites',
    a13Name: 'Lupin',     a14Name: 'Molluscs',
    a1Desc: 'Cereals containing gluten (wheat, rye, barley, oats, spelt, kamut or hybridized strains)',
    a2Desc: 'Crustaceans and products based on crustaceans',
    a3Desc: 'Eggs and egg-based products',
    a4Desc: 'Fish and fish-based products',
    a5Desc: 'Peanuts and peanut-based products',
    a6Desc: 'Soybeans and soybean-based products (tofu, miso, soy sauce)',
    a7Desc: 'Milk and dairy products (including lactose)',
    a8Desc: 'Nuts / Tree nuts: almonds, hazelnuts, walnuts, cashews, pecans, pistachios, etc.',
    a9Desc: 'Celery and celeriac (celery root)',
    a10Desc: 'Mustard and mustard-based products',
    a11Desc: 'Sesame seeds and sesame-based products (tahini)',
    a12Desc: 'Sulfites and sulfur dioxide (concentration >10mg/kg or 10mg/L)',
    a13Desc: 'Lupin and lupin-based products',
    a14Desc: 'Molluscs (squid, octopus, snail, clams, mussels, oysters, etc.)',
    containsAllergens: 'Contains:',
    editedNotice: 'Changes are saved automatically to your menu.',
  },
  fr: {
    pageTitle: "INFORMATION SUR LES ALLERGÈNES",
    pageSubtitle: "Produits ou plats contenant des allergènes",
    productsContaining: "PRODUITS OU PLATS CONTENANT DES ALLERGÈNES",
    print: "Imprimer",
    noDishes: "Aucun plat trouvé",
    noDishesDesc: "Ajoutez des plats à votre menu d'abord, puis revenez pour générer ce tableau.",
    autoDetect: "Détection automatique",
    autoDetectDone: "Détecté !",
    clearAll: "Effacer toutes les marques",
    styleClassic: 'Blanc Classique',
    styleBlackboard: 'Tableau Noir',
    styleWarm: 'Beige Chaleureux',
    styleModern: 'Moderne Bleu',
    pageOf: 'Page {0} sur {1}',
    a1Name: 'Gluten',    a2Name: 'Crustacés',  a3Name: 'Oeufs',    a4Name: 'Poisson',
    a5Name: 'Arachides', a6Name: 'Soja',       a7Name: 'Lait',    a8Name: 'Fruits à coque',
    a9Name: 'Céleri',    a10Name: 'Moutarde',   a11Name: 'Sésame', a12Name: 'Sulfites',
    a13Name: 'Lupin',    a14Name: 'Mollusques',
    a1Desc: 'Céréales contenant du gluten (blé, seigle, orge, avoine, épeautre, kamut ou hybrides)',
    a2Desc: 'Crustacés et produits à base de crustacés',
    a3Desc: 'Oeufs et produits à base d\'oeufs',
    a4Desc: 'Poissons et produits à base de poisson',
    a5Desc: 'Arachides et produits à base d\'arachides',
    a6Desc: 'Soja et produits à base de soja (tofu, miso, sauce soja)',
    a7Desc: 'Lait et produits laitiers (y compris le lactose)',
    a8Desc: 'Fruits à coque: amandes, noisettes, noix, noix de cajou, noix de pécan, pistaches, etc.',
    a9Desc: 'Céleri et céleri-rave (racine de céleri)',
    a10Desc: 'Moutarde et produits à base de moutarde',
    a11Desc: 'Graines de sésame et produits à base de sésame (tahini)',
    a12Desc: 'Sulfites et dioxyde de soufre (concentration >10mg/kg ou 10mg/L)',
    a13Desc: 'Lupin et produits à base de lupin',
    a14Desc: 'Mollusques (calmar, poulpe, escargot, coques, moules, huîtres, etc.)',
    containsAllergens: 'Contient :',
    editedNotice: 'Les modifications sont sauvegardées automatiquement.',
  },
  es: {
   pageTitle: 'INFORMACIÓN SOBRE ALÉRGENOS',
    pageSubtitle: 'Productos o platos que contienen alérgenos',
    productsContaining: 'PRODUCTOS O PLATOS QUE CONTIENEN ALÉRGENOS',
    print: 'Imprimir',
    noDishes: 'No se encontraron platos',
    noDishesDesc: 'Añada platos a su menú primero, luego regrese para generar esta tabla.',
    autoDetect: 'Detección automática',
    autoDetectDone: '¡Detectado!',
    clearAll: 'Borrar todas las marcas',
    styleClassic: 'Blanco Clásico',
    styleBlackboard: 'Pizarra Negra',
    styleWarm: 'Beige Cálido',
    styleModern: 'Moderno Azul',
    pageOf: 'Página {0} de {1}',
    a1Name: 'Gluten',      a2Name: 'Crustáceos', a3Name: 'Huevos',    a4Name: 'Pescado',
    a5Name: 'Cacahuates',  a6Name: 'Soja',       a7Name: 'Leche',    a8Name: 'Frutos secos',
    a9Name: 'Apio',       a10Name: 'Mostaza',    a11Name: 'Sésamo',  a12Name: 'Sulfitos',
    a13Name: 'Altramuces', a14Name: 'Moluscos',
    a1Desc: 'Cereales que contienen gluten (trigo, centeno, cebada, avena, espelta, kamut o híbridos)',
    a2Desc: 'Crustáceos y productos a base de crustáceos',
    a3Desc: 'Huevos y productos a base de huevo',
    a4Desc: 'Pescados y productos a base de pescado',
    a5Desc: 'Cacahuates y productos a base de cacahuates',
    a6Desc: 'Soja y productos a base de soja (tofu, miso, salsa de soja)',
    a7Desc: 'Leche y productos lácteos (incluyendo lactosa)',
    a8Desc: 'Frutos secos: almendras, avellanas, nuez, anacardo, pacana, pistacho, etc.',
    a9Desc: 'Apio y apionabo (raíz de apio)',
    a10Desc: 'Mostaza y productos a base de mostaza',
    a11Desc: 'Semillas de sésamo y productos a base de sésame (tahini)',
    a12Desc: 'Sulfitos y dióxido de azufre (concentración >10mg/kg o 10mg/L)',
    a13Desc: 'Altramuces y productos a base de altramuces',
    a14Desc: 'Moluscos (calamar, pulpo, caracol, almejas, mejillones, ostras, etc.)',
    containsAllergens: 'Contiene:',
    editedNotice: 'Los cambios se guardan automáticamente en su menú.',
  },
  de: {
    pageTitle: 'ALLERGEN-INFORMATIONEN',
    pageSubtitle: 'Produkte oder Gerichte mit Allergenen',
    productsContaining: 'PRODUKTE ODER GERICHTE MIT ALLERGENEN',
    print: 'Drucken',
    noDishes: 'Keine Gerichte gefunden',
    noDishesDesc: 'Fügen Sie zuerst Gerichte zum Menü hinzu, dann kehren Sie zurück, um diese Tabelle zu erstellen.',
    autoDetect: 'Automatische Erkennung',
    autoDetectDone: 'Erkannt!',
    clearAll: 'Alle Markierungen löschen',
    styleClassic: 'Klassisch Weiß',
    styleBlackboard: 'Tafel Schwarz',
    styleWarm: 'Wärme Beige',
    styleModern: 'Modern Blau',
    pageOf: 'Seite {0} von {1}',
    a1Name: 'Gluten',       a2Name: 'Krebstiere',  a3Name: 'Eier',      a4Name: 'Fisch',
    a5Name: 'Erdnüsse',    a6Name: 'Sojabohnen',  a7Name: 'Milch',    a8Name: 'Schalenfrüchte',
    a9Name: 'Sellerie',    a10Name: 'Senf',       a11Name: 'Sesam',    a12Name: 'Sulfite',
    a13Name: 'Lupinen',    a14Name: 'Weichtiere',
    a1Desc: 'Getreide mit Gluten (Weizen, Roggen, Gerste, Hafer, Dinkel, Kamut oder Kreuzungen)',
    a2Desc: 'Krebstiere und krebstierbasierte Produkte',
    a3Desc: 'Eier und eibasierte Produkte',
    a4Desc: 'Fisch und fischbasierte Produkte',
    a5Desc: 'Erdnüsse und erdnussbasierte Produkte',
    a6Desc: 'Sojabohnen und sojabasierte Produkte (Tofu, Miso, Sojasauce)',
    a7Desc: 'Milch und Milchprodukte (einschließlich Laktose)',
    a8Desc: 'Schalenfrüchte: Mandeln, Haselnüsse, Walnüsse, Cashews, Pekannüsse, Pistazien usw.',
    a9Desc: 'Sellerie und Selleriewurzel (Knollensellerie)',
    a10Desc: 'Senf und senfbasierte Produkte',
    a11Desc: 'Sesamsamen und sesambasierte Produkte (Tahini)',
    a12Desc: 'Sulfite und Schwefeldioxid (Konzentration >10mg/kg oder 10mg/L)',
    a13Desc: 'Lupinen und lupinenbasierte Produkte',
    a14Desc: 'Weichtiere (Tintenfisch, Krake, Schnecken, Muscheln, Austern usw.)',
    containsAllergens: 'Enthält:',
    editedNotice: 'Änderungen werden automatisch im Menü gespeichert.',
  },
  zh: {
    pageTitle: '过敏原信息表',
    pageSubtitle: '含有过敏原的菜品或产品',
    productsContaining: '含有过敏原的菜品或产品',
    print: '打印',
    noDishes: '未找到菜品',
    noDishesDesc: '请先添加菜品到菜单，然后再回来生成此图表。',
    autoDetect: '自动识别过敏原',
    autoDetectDone: '已识别！',
    clearAll: '清除所有标记',
    styleClassic: '经典白',
    styleBlackboard: '黑板黑',
    styleWarm: '暖色米',
    styleModern: '现代蓝',
    pageOf: '第 {0} 页，共 {1} 页',
    a1Name: '麸质',    a2Name: '甲壳类',  a3Name: '鸡蛋',   a4Name: '鱼类',
    a5Name: '花生',    a6Name: '大豆',    a7Name: '牛奶',   a8Name: '坚果',
    a9Name: '芹菜',    a10Name: '芥末',   a11Name: '芝麻', a12Name: '亚硫酸盐',
    a13Name: '羽扇豆',  a14Name: '软体动物',
    a1Desc: '含麸质的谷物（小麦、黑麦、大麦、燕麦、斯佩尔特小麦、卡姆小麦或杂交品种）',
    a2Desc: '甲壳类及其制品（虾、蟹、龙虾等）',
    a3Desc: '蛋类及其制品（包括蛋黄酱、蛋白霜等）',
    a4Desc: '鱼类及其制品（三文鱼、金枪鱼、鳕鱼、凤尾鱼等）',
    a5Desc: '花生及其制品（花生酱、花生油等）',
    a6Desc: '大豆及其制品（豆腐、味噌、酱油等）',
    a7Desc: '奶及乳制品（包括乳糖、酪蛋白等）',
    a8Desc: '坚果/树坚果：杏仁、榛子、核桃、腰果、碧根果、开心果等',
    a9Desc: '芹菜及块根芹菜（芹菜根）',
    a10Desc: '芥末及其制品（第戎芥末酱等）',
    a11Desc: '芝麻及其制品（芝麻酱、芝麻油等）',
    a12Desc: '亚硫酸盐及二氧化硫（浓度>10mg/kg 或 10mg/L），常见于葡萄酒、干果中',
    a13Desc: '羽扇豆及其制品',
    a14Desc: '软体动物（鱿鱼、章鱼、蜗牛、蛤蜊、牡蛎、贻贝等）',
    containsAllergens: '含有：',
    editedNotice: '更改将自动保存到您的菜单。',
  },
};

function getAT(code: string): Translations {
  return ALLERGEN_TRANSLATIONS[code] || ALLERGEN_TRANSLATIONS['en']!;
}

/* ===================================================================
   Background Style Definitions — 4 themes
   =================================================================== */
type StyleId = 'classic' | 'blackboard' | 'warm' | 'modern';

interface StyleConfig {
  id: StyleId;
  name: string;
  bg: string;
  frameBg: string;
  framePadding: number;
  titleBg: string;
  headerBg: string;
  headerText: string;
  titleText: string;
  subtitleText: string;
  textColor: string;
  borderColor: string;
  strongBorderColor: string;
  rowEvenBg: string;
  rowOddBg: string;
  cellActiveBg: string;
  cellActiveBorder: string;
  legendBg: string;
  legendText: string;
  gridLineColor: string;
  markText: string;
}

const STYLES: Record<StyleId, StyleConfig> = {
  classic: {
    id: 'classic', name: 'Classic White',
    bg: '#ffffff', frameBg: '#ffffff', framePadding: 0, titleBg: '#ffffff',
    headerBg: '#f0f4f8', headerText: '#1a1a2e',
    titleText: '#1a1a2e', subtitleText: '#6b7280',
    textColor: '#1a1a2e', borderColor: '#c9ced6', strongBorderColor: '#9ca3af',
    rowOddBg: '#ffffff', rowEvenBg: '#f7f8fa', cellActiveBg: 'rgba(255,212,0,0.14)', cellActiveBorder: '#151526',
    legendBg: '#f8f9fa', legendText: '#374151', gridLineColor: '#e5e7eb', markText: '#ffffff',
  },
  blackboard: {
    id: 'blackboard', name: 'Bistro Blackboard',
    bg: '#ffffff', frameBg: '#11100f', framePadding: 5, titleBg: '#11100f',
    headerBg: '#ffffff', headerText: '#34302b',
    titleText: '#f6b51d', subtitleText: '#f3f4f6',
    textColor: '#191817', borderColor: '#a8a29e', strongBorderColor: '#57534e',
    rowOddBg: '#ffffff', rowEvenBg: '#f2f0ef', cellActiveBg: 'rgba(17,16,15,0.08)', cellActiveBorder: '#11100f',
    legendBg: '#11100f', legendText: '#f4f4f5', gridLineColor: '#a8a29e', markText: '#ffffff',
  },
  warm: {
    id: 'warm', name: 'Warm Cafe',
    bg: '#fffaf1', frameBg: '#7a3f1d', framePadding: 3, titleBg: '#7a3f1d',
    headerBg: '#fff2d6', headerText: '#5b3219',
    titleText: '#fff7ed', subtitleText: '#fee6c0',
    textColor: '#3d3020', borderColor: '#d9b98f', strongBorderColor: '#9a6a3f',
    rowOddBg: '#fffaf1', rowEvenBg: '#fbefd8', cellActiveBg: 'rgba(180,60,30,0.10)', cellActiveBorder: '#b43c1e',
    legendBg: '#fff2d6', legendText: '#5c4033', gridLineColor: '#e0d8c8', markText: '#ffffff',
  },
  modern: {
    id: 'modern', name: 'Fresh Grid',
    bg: '#f7fbff', frameBg: '#0f766e', framePadding: 3, titleBg: '#0f766e',
    headerBg: '#e8f7f3', headerText: '#164e63',
    titleText: '#ecfeff', subtitleText: '#ccfbf1',
    textColor: '#102a43', borderColor: '#9ccdc5', strongBorderColor: '#0f766e',
    rowOddBg: '#ffffff', rowEvenBg: '#eef8f6', cellActiveBg: 'rgba(15,118,110,0.10)', cellActiveBorder: '#0f766e',
    legendBg: '#e8f7f3', legendText: '#164e63', gridLineColor: '#b6e1dc', markText: '#ffffff',
  },
};

const STYLE_ORDER: StyleId[] = ['classic', 'blackboard', 'warm', 'modern'];

/* A4 landscape print geometry. Keep these values conservative so table + legend never overflows. */
const A4_LANDSCAPE_W_MM = 297;
const A4_LANDSCAPE_H_MM = 210;
const PAGE_MARGIN_MM = 10;
const DISH_COL_W_MM = 58;
const ALLERGEN_COL_W_MM = (A4_LANDSCAPE_W_MM - PAGE_MARGIN_MM * 2 - DISH_COL_W_MM) / 14;
const MATRIX_HEADER_H_MM = 16;
const MATRIX_ROW_H_MM = 8.2;
const LEGEND_TOP_MM = 5.5;

/* Keep the legend compact at the bottom so each page can hold more dishes. */
const ROWS_PER_PAGE = 12;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, ch => {
    switch (ch) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return ch;
    }
  });
}

/* ===================================================================
   Auto-detection: analyze dish name + description for allergen keywords
   =================================================================== */
function detectAllergens(dish: Dish): Set<string> {
  const found = new Set<string>();
  const text = `${dish.name} ${dish.description}`.toLowerCase();

  // Start with existing allergens from dish data
  if (dish.allergens && Array.isArray(dish.allergens)) {
    dish.allergens.forEach((a: string) => {
      const normalized = a.toLowerCase().trim();
      // Map common variations to standard IDs
      if (normalized.includes('gluten') || normalized === 'wheat' || normalized === 'flour') found.add('gluten');
      else if (normalized.includes('crustacean') || normalized.includes('shrimp') || normalized.includes('prawn') || normalized.includes('crab')) found.add('crustaceans');
      else if (normalized.includes('egg')) found.add('eggs');
      else if (normalized.includes('fish') && !normalized.includes('shellfish')) found.add('fish');
      else if (normalized.includes('peanut') || normalized.includes('groundnut')) found.add('peanuts');
      else if (normalized.includes('soy') || normalized === 'tofu') found.add('soybeans');
      else if (normalized.includes('milk') || normalized.includes('dairy') || normalized.includes('cheese') || normalized.includes('cream') || normalized.includes('butter') || normalized.includes('yogurt')) found.add('milk');
      else if (normalized === 'nuts' || normalized.includes('almond') || normalized.includes('walnut') || normalized.includes('cashew') || normalized.includes('hazelnut') || normalized.includes('pecan') || normalized.includes('pistachio') || normalized === 'tree nuts') found.add('nuts');
      else if (normalized.includes('celery')) found.add('celery');
      else if (normalized.includes('mustard')) found.add('mustard');
      else if (normalized.includes('sesame')) found.add('sesame');
      else if (normalized.includes('sulfite')) found.add('sulfites');
      else if (normalized.includes('lupin')) found.add('lupin');
      else if (normalized.includes('mollusc') || normalized.includes('mollusk') || normalized.includes('squid') || normalized.includes('octopus') || normalized.includes('snail') || normalized.includes('clam') || normalized.includes('mussel') || normalized.includes('oyster')) found.add('molluscs');
      else {
        // Try exact match with allergen ID
        const match = EU_ALLERGENS.find(ag => ag.id === normalized || ag.id === a);
        if (match) found.add(match.id);
      }
    });
  }

  // Keyword detection
  for (const ag of EU_ALLERGENS) {
    if (found.has(ag.id)) continue; // already have it
    for (const kw of ag.keywords) {
      if (text.includes(kw)) {
        found.add(ag.id);
        break;
      }
    }
  }

  return found;
}

/* ===================================================================
   Helper: flatten dishes from all sections with their section info
   =================================================================== */
interface FlatDish {
  dish: Dish;
  sectionName: string;
  sectionIndex: number;
  dishIndex: number;
  detectedAllergens: Set<string>;
  userAllergens: Set<string>;
}

/* ===================================================================
   Main Page Component (wrapped with LanguageProvider)
   =================================================================== */
export default function PaperMenuPage() {
  return (
    <LanguageProvider>
      <PaperMenuPageContent />
    </LanguageProvider>
  );
}

function PaperMenuPageContent() {
  const navigate = useNavigate();
  const { menus, updateMenu } = useMenuContext();
  const { uiLang, t: tMain } = useLanguage();
  const tr = useMemo(() => getAT(uiLang), [uiLang]);

  const [selectedMenuId, setSelectedMenuId] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<StyleId>('classic');
  const [displayLang, setDisplayLang] = useState<string>('en');
  const [scale, setScale] = useState(0.85);
  const [currentPage, setCurrentPage] = useState(0);
  const [autoDetected, setAutoDetected] = useState(false);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);

  /* Per-dish user-editable allergen state: dishId -> Set<allergenId> */
  const [dishAllergenEdits, setDishAllergenEdits] = useState<Record<string, Set<string>>>({});
  const [saveFeedback, setSaveFeedback] = useState('');

  /* Available display languages for the poster */
  const DISPLAY_LANGS = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
  ];

  const selectedMenu = menus.find(m => m.id === selectedMenuId);

  /* Auto-select first menu */
  useEffect(() => {
    if (!selectedMenuId && menus.length > 0) {
      setSelectedMenuId(menus[0].id);
    }
  }, [menus, selectedMenuId]);

  /* Build flat dish list with detected + user-edited allergens */
  const flatDishes: FlatDish[] = useMemo(() => {
    if (!selectedMenu) return [];
    const result: FlatDish[] = [];
    selectedMenu.sections.forEach((sec, si) => {
      sec.dishes.filter(d => d.isVisible).forEach((dish, di) => {
        const detected = detectAllergens(dish);
        const userEdits = dishAllergenEdits[dish.id];
        result.push({
          dish,
          sectionName: sec.name,
          sectionIndex: si,
          dishIndex: di,
          detectedAllergens: detected,
          userAllergens: userEdits || new Set(detected), // default to detected
        });
      });
    });
    return result;
  }, [selectedMenu, dishAllergenEdits, autoDetected]);

  /* Paginate dishes */
  const totalPages = Math.max(1, Math.ceil(flatDishes.length / ROWS_PER_PAGE));
  const paginatedDishes = useMemo(() => {
    const pages: FlatDish[][] = [];
    for (let i = 0; i < flatDishes.length; i += ROWS_PER_PAGE) {
      pages.push(flatDishes.slice(i, i + ROWS_PER_PAGE));
    }
    return pages;
  }, [flatDishes]);

  /* Auto-detect handler */
  const handleAutoDetect = () => {
    const edits: Record<string, Set<string>> = {};
    flatDishes.forEach(fd => {
      edits[fd.dish.id] = new Set(fd.detectedAllergens);
    });
    setDishAllergenEdits(edits);
    setAutoDetected(true);
    setTimeout(() => setAutoDetected(false), 2000);
  };

  /* Toggle allergen for a dish */
  const toggleAllergen = (dishId: string, allergenId: string) => {
    setDishAllergenEdits(prev => {
      const current = prev[dishId] || new Set();
      const next = new Set(current);
      if (next.has(allergenId)) {
        next.delete(allergenId);
      } else {
        next.add(allergenId);
      }
      /* Save back to menu context */
      if (selectedMenu) {
        updateMenu(selectedMenu.id, (menu) => ({
          ...menu,
          sections: menu.sections.map(sec => ({
            ...sec,
            dishes: sec.dishes.map(d => {
              if (d.id !== dishId) return d;
              return {
                ...d,
                allergens: Array.from(next),
              };
            }),
          })),
        }));
      }
      return { ...prev, [dishId]: next };
    });

    /* Show save feedback */
    setSaveFeedback('Saved!');
    setTimeout(() => setSaveFeedback(''), 1500);
  };

  /* Clear all marks */
  const handleClearAll = () => {
    setDishAllergenEdits({});
    if (selectedMenu) {
      updateMenu(selectedMenu.id, (menu) => ({
        ...menu,
        sections: menu.sections.map(sec => ({
          ...sec,
          dishes: sec.dishes.map(d => ({ ...d, allergens: [] })),
        })),
      }));
    }
  };

  /* Print handler — generates clean HTML for A4 landscape printing */
  const handlePrint = () => {
    const style = STYLES[selectedStyle];
    const displayTr = getAT(displayLang);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const sheetPaddingMm = Math.max(5, PAGE_MARGIN_MM - style.framePadding);

    let html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>${displayTr.pageTitle}</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; padding: 0; font-family: 'Inter','-apple-system',sans-serif; background:#fff; }
  .page { width: ${A4_LANDSCAPE_W_MM}mm; height: ${A4_LANDSCAPE_H_MM}mm; 
    background:${style.frameBg}; color:${style.textColor};
    padding:${style.framePadding}mm; page-break-after: always;
    position:relative; overflow:hidden; }
  .sheet{width:100%;height:100%;background:${style.bg};padding:${sheetPaddingMm}mm;overflow:hidden;position:relative;}
  .page:last-child{page-break-after:auto;}
  
  .title-row{text-align:center;margin-bottom:3.5mm;background:${style.titleBg};padding:3mm 3mm 2.4mm;border:1px solid ${style.strongBorderColor};}
  .title-row h1{font-size:18pt;font-weight:900;letter-spacing:0.1em;margin:0;color:${style.titleText};}
  .title-row p{font-size:7pt;margin:1.2mm 0 0;color:${style.subtitleText};opacity:0.9;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;}
  
  .matrix-table{width:100%;border-collapse:collapse;font-size:7pt;table-layout:fixed;}
  .matrix-table th{height:${MATRIX_HEADER_H_MM}mm;background:${style.headerBg};color:${style.headerText};padding:1mm 0.6mm;
    text-align:center;font-weight:700;border:1px solid ${style.strongBorderColor};font-size:6.2pt;vertical-align:bottom;overflow:hidden;}
  .matrix-table th.dish-head{width:${DISH_COL_W_MM}mm;text-align:center;padding:1.4mm 2mm;font-size:10pt;line-height:1.15;text-transform:uppercase;letter-spacing:0.04em;}
  .matrix-table th.allergen-head{width:${ALLERGEN_COL_W_MM}mm;}
  .matrix-table th .icon-circle{display:inline-flex;width:8.2mm;height:8.2mm;border-radius:50%;
    align-items:center;justify-content:center;font-size:5.8pt;font-weight:900;color:#fff;margin-bottom:0.55mm;border:1.2px solid rgba(255,255,255,0.72);box-shadow:inset 0 0 0 1px rgba(0,0,0,0.08);}
  .matrix-table th .allergen-name{display:block;font-weight:700;line-height:1.05;letter-spacing:0;overflow:hidden;}
  .matrix-table th .allergen-number{display:block;font-size:5pt;line-height:1.1;margin-top:0.4mm;color:${style.textColor};opacity:0.72;}
  .matrix-table td{height:${MATRIX_ROW_H_MM}mm;border:1px solid ${style.borderColor};
    text-align:left;vertical-align:middle;font-weight:500;overflow:hidden;}
  .matrix-table td.dish-cell{width:${DISH_COL_W_MM}mm;padding:0.7mm 1.6mm;font-size:7.6pt;line-height:1.15;}
  .dish-name{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;white-space:normal;}
  .matrix-table td.allergen-cell{text-align:center;padding:0;width:${ALLERGEN_COL_W_MM}mm;min-width:0;}
  .matrix-table tr:nth-child(odd) td{background:${style.rowOddBg};}
  .matrix-table tr:nth-child(even) td{background:${style.rowEvenBg};}
  .active-cell{background:${style.cellActiveBg} !important;border:1.4px solid ${style.cellActiveBorder};
    border-radius:50%;width:5.6mm;height:5.6mm;display:inline-flex;align-items:center;justify-content:center;
    font-size:5.5pt;font-weight:900;color:${style.markText};}
  
  .legend{margin-top:${LEGEND_TOP_MM}mm;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1.15mm 4mm;justify-items:stretch;background:${style.legendBg};padding:2.6mm 3.4mm;border-radius:1.5mm;border:1px solid ${style.borderColor};}
  .legend-item{min-height:5.2mm;font-size:6.55pt;line-height:1.2;color:${style.legendText};display:block;}
  .legend-item b{color:${style.headerText};font-weight:800;}
  .legend-index{font-weight:900;color:${style.headerText};}
  .num-badge{display:inline-flex;align-items:center;justify-content:center;width:5mm;height:5mm;
    border-radius:50%;font-size:5.4pt;font-weight:800;color:#fff;flex-shrink:0;}
  
  @media print{ body{background:#fff;} .page{box-shadow:none!important;margin:0;} }
</style></head><body>`;

    for (let pi = 0; pi < paginatedDishes.length; pi++) {
      const pageDishes = paginatedDishes[pi];
      html += `<div class="page"><div class="sheet">`;
      html += `<div class="title-row">`;
      html += `<h1>${escapeHtml(displayTr.pageTitle)}</h1>`;
      html += `<p>${escapeHtml(displayTr.productsContaining)}</p>`;
      html += `</div>`;
      html += `<table class="matrix-table"><thead><tr>`;
      html += `<th class="dish-head"><span>${displayLang === 'zh' ? '含有过敏原的菜品或产品' : 'PRODUCTS OR DISHES CONTAINING ALLERGENS'}</span></th>`;
      for (const ag of EU_ALLERGENS) {
        const name = (displayTr as any)[ag.key] || ag.id;
        html += `<th class="allergen-head"><div class="icon-circle" style="background:${ag.color}">${escapeHtml(ag.symbol)}</div><span class="allergen-name">${escapeHtml(name)}</span><span class="allergen-number">${ag.number}</span></th>`;
      }
      html += `</tr></thead><tbody>`;

      pageDishes.forEach((fd, ri) => {
        const isEven = ri % 2 === 1;
        const userAlls = dishAllergenEdits[fd.dish.id] || fd.userAllergens;
        html += `<tr${isEven ? '' : ''}>`;
        html += `<td class="dish-cell"><div class="dish-name">${escapeHtml(fd.dish.name)}</div></td>`;
        for (const ag of EU_ALLERGENS) {
          const hasIt = userAlls.has(ag.id);
          html += `<td class="allergen-cell">`;
          if (hasIt) {
            html += `<div class="active-cell" style="background:${ag.color}!important;border-color:${ag.color}!important;color:#fff!important;">✓</div>`;
          }
          html += `</td>`;
        }
        html += `</tr>`;
      });

      /* Fill empty rows if last page */
      const remainingRows = ROWS_PER_PAGE - pageDishes.length;
      for (let e = 0; e < remainingRows; e++) {
        const isEven = (pageDishes.length + e) % 2 === 1;
        html += `<tr><td class="dish-cell" style="opacity:0.3">&nbsp;</td>`;
        for (let c = 0; c < 14; c++) html += `<td class="allergen-cell">&nbsp;</td>`;
        html += `</tr>`;
      }

      html += `</tbody></table>`;

      /* Legend */
      html += `<div class="legend">`;
      EU_ALLERGENS.forEach(ag => {
        const name = (displayTr as any)[ag.key] || ag.id;
        const desc = (displayTr as any)[ag.descKey] || '';
        html += `<div class="legend-item"><span class="legend-index">${ag.number}. </span><b>${escapeHtml(name)}</b>: ${escapeHtml(desc)}</div>`;
      });
      html += `</div>`;

      html += `</div></div>`; // page end
    }

    html += `</body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };

  /* Get current display translations */
  const dTr = useMemo(() => getAT(displayLang), [displayLang]);
  const style = STYLES[selectedStyle];

  /* Empty state */
  if (!selectedMenu || flatDishes.length === 0) {
    return (
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/app')} className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <select value={selectedMenuId} onChange={(e) => setSelectedMenuId(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 pr-8 bg-white focus:outline-none focus:ring-2 focus:ring-[#FFD400]/30 focus:border-[#F2B900]">
              <option value="">Select a menu...</option>
              {menus.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center bg-[#fafbfc]">
          <div className="text-center max-w-md">
            <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-[#fff8d8] flex items-center justify-center">
              <UtensilsCrossed className="h-8 w-8 text-[#b98900]" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{tr.noDishes}</h2>
            <p className="text-sm text-gray-500 mb-6">{tr.noDishesDesc}</p>
            {menus.length === 0 && (
              <Button onClick={() => navigate('/app')}>Create a menu first</Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ===== TOP TOOLBAR ===== */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/app')} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>

          <div className="w-px h-6 bg-gray-200" />

          <select value={selectedMenuId} onChange={(e) => setSelectedMenuId(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 pr-8 bg-white focus:outline-none focus:ring-2 focus:ring-[#FFD400]/30 focus:border-[#F2B900]">
            {menus.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>

          {/* Auto-detect button */}
          <Button variant="outline" size="sm" onClick={handleAutoDetect}
            className={`gap-1.5 border-[#f1d36a] text-[#8a6500] hover:bg-[#fff8d8] ${autoDetected ? 'border-green-400 text-green-600' : ''}`}>
            {autoDetected ? <Check className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
            {autoDetected ? tr.autoDetectDone : tr.autoDetect}
          </Button>

          <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-red-500 hover:text-red-600 hover:bg-red-50">
            {tr.clearAll}
          </Button>

          {saveFeedback && (
            <span className="text-xs font-medium text-green-600 animate-in fade-in zoom-in-95">{saveFeedback}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Language picker */}
          <div className="relative">
            <Button variant="outline" size="sm" onClick={() => setShowLangPicker(!showLangPicker)}
              className="border-gray-200 text-sm font-medium gap-1.5">
              <Languages className="h-3.5 w-3.5" />
              {DISPLAY_LANGS.find(l => l.code === displayLang)?.flag} {DISPLAY_LANGS.find(l => l.code === displayLang)?.label}
              <ChevronDown className="h-3 w-3" />
            </Button>
            {showLangPicker && (
              <div className="absolute right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 p-1.5 z-50 min-w-[160px]">
                {DISPLAY_LANGS.map(l => (
                  <button key={l.code} onClick={() => { setDisplayLang(l.code); setShowLangPicker(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      l.code === displayLang ? 'bg-[#fff8d8] text-[#8a6500] font-semibold' : 'hover:bg-gray-50 text-gray-700'
                    }`}>
                    <span>{l.flag}</span> {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Style picker */}
          <div className="relative">
            <Button variant="outline" size="sm" onClick={() => setShowStylePicker(!showStylePicker)}
              className="border-gray-200 text-sm font-medium gap-1.5">
              <Layout className="h-3.5 w-3.5" />
              {STYLES[selectedStyle].name}
              <ChevronDown className="h-3 w-3" />
            </Button>
            {showStylePicker && (
              <div className="absolute right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50">
                {STYLE_ORDER.map(sid => {
                  const s = STYLES[sid];
                  return (
                    <button key={sid} onClick={() => { setSelectedStyle(sid); setShowStylePicker(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        sid === selectedStyle ? 'bg-[#fff8d8] ring-1 ring-[#FFD400]/40' : 'hover:bg-gray-50'
                      }`}>
                      <div className="w-8 h-8 rounded-md border border-gray-200 shrink-0" style={{ backgroundColor: s.bg }} />
                      <span className="text-sm font-semibold text-gray-900 flex-1 text-left">{s.name}</span>
                      {sid === selectedStyle && <Eye className="h-3.5 w-3.5 text-[#b98900]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={handlePrint} className="border-gray-200 text-sm gap-1.5">
            <Printer className="h-3.5 w-3.5" /> {tr.print}
          </Button>

          <Button size="sm" onClick={handlePrint} className="bg-[#FFD400] hover:bg-[#F2B900] text-[#151526] font-bold text-sm gap-1.5">
            <Download className="h-3.5 w-3.5" /> Download PDF
          </Button>
        </div>
      </div>

      {/* ===== MAIN CANVAS AREA ===== */}
      <main className="flex-1 overflow-auto bg-[#f0f1f3] p-6 md:p-8 flex flex-col items-center relative">
        <div className="flex flex-wrap justify-center gap-8 pb-20">
          {paginatedDishes.map((pageDishes, pageIndex) => {
            const isActivePage = pageIndex === currentPage;
            return (
              <div key={`page-${pageIndex}`} className="relative" style={{
                width: `${A4_LANDSCAPE_W_MM * scale}mm`,
                height: `${A4_LANDSCAPE_H_MM * scale}mm`,
                marginBottom: `${8 * scale}mm`,
              }}>
                {/* Page label */}
                {totalPages > 1 && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-2">
                    <span className="text-[11px] font-medium text-gray-400 bg-white/80 px-2.5 py-0.5 rounded-full border border-gray-100 shadow-sm">
                      {tr.pageOf.replace('{0}', String(pageIndex + 1)).replace('{1}', String(totalPages))}
                    </span>
                    {isActivePage && <span className="text-[10px] text-[#8a6500] font-semibold bg-[#fff8d8] px-2 py-0.5 rounded-full">Active</span>}
                  </div>
                )}

                {/* A4 Page Container */}
                <AllergenPosterPage
                  styleConfig={style}
                  dishes={pageDishes}
                  dishAllergens={dishAllergenEdits}
                  displayTr={dTr}
                  scale={scale}
                  pageIndex={pageIndex}
                  onToggle={toggleAllergen}
                  isInteractive={isActivePage}
                  totalPages={totalPages}
                />
              </div>
            );
          })}
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2 z-40">
          {/* Page navigator */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 bg-white rounded-xl shadow-md border border-gray-100 px-2.5 py-1.5">
              <button disabled={currentPage <= 0} onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="h-3.5 w-3.5 text-gray-600" />
              </button>
              <div className="flex items-center gap-1 min-w-[90px] justify-center">
                {paginatedDishes.map((_, pi) => (
                  <button key={pi} onClick={() => setCurrentPage(pi)}
                    className={`w-6 h-6 rounded-full text-[10px] font-semibold transition-all ${
                      pi === currentPage ? 'bg-[#151526] text-[#FFD400] shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`} title={`Go to page ${pi + 1}`}>{pi + 1}</button>
                ))}
              </div>
              <button disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="h-3.5 w-3.5 text-gray-600" />
              </button>
            </div>
          )}

          {/* Zoom controls */}
          <div className="flex items-center gap-1.5 bg-white rounded-xl shadow-md border border-gray-100 px-2.5 py-1.5">
            <button disabled={scale <= 0.4} onClick={() => setScale(s => Math.max(0.4, +(s - 0.1).toFixed(2)))}
              className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-30"><ZoomOut className="h-3.5 w-3.5 text-gray-600" /></button>
            <div className="min-w-[46px] text-center"><span className="text-xs font-semibold text-gray-700 tabular-nums">{Math.round(scale * 100)}%</span></div>
            <button disabled={scale >= 1.5} onClick={() => setScale(s => Math.min(1.5, +(s + 0.1).toFixed(2)))}
              className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-30"><ZoomIn className="h-3.5 w-3.5 text-gray-600" /></button>
          </div>

          <span className="text-[10px] text-gray-400 pr-1">{totalPages} page{totalPages > 1 ? 's' : ''}</span>
        </div>
      </main>
    </div>
  );
}

/* ===================================================================
   Allergen Poster Page Component — Single A4 Landscape page
   =================================================================== */
function AllergenPosterPage({
  styleConfig: style,
  dishes,
  dishAllergens,
  displayTr,
  scale,
  pageIndex,
  onToggle,
  isInteractive,
  totalPages,
}: {
  styleConfig: StyleConfig;
  dishes: FlatDish[];
  dishAllergens: Record<string, Set<string>>;
  displayTr: Translations;
  scale: number;
  pageIndex: number;
  onToggle: (dishId: string, allergenId: string) => void;
  isInteractive: boolean;
  totalPages: number;
}) {
  const pageW = A4_LANDSCAPE_W_MM;
  const pageH = A4_LANDSCAPE_H_MM;
  const sheetPaddingMm = Math.max(5, PAGE_MARGIN_MM - style.framePadding);

  return (
    <div
      data-allergen-page
      className="relative mx-auto overflow-hidden"
      style={{
        width: `${pageW * scale}mm`,
        height: `${pageH * scale}mm`,
        backgroundColor: style.frameBg,
        padding: `${style.framePadding * scale}mm`,
        borderRadius: 3,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 40px rgba(0,0,0,0.06)',
        fontFamily: "'Inter', '-apple-system', sans-serif",
      }}
    >
      <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: style.bg,
        overflow: 'hidden',
        padding: `${sheetPaddingMm * scale}mm`,
      }}>
        {/* Title */}
        <div style={{
          textAlign: 'center',
          marginBottom: `${3.5 * scale}mm`,
          background: style.titleBg,
          padding: `${3 * scale}mm ${3 * scale}mm ${2.4 * scale}mm`,
          border: `1px solid ${style.strongBorderColor}`,
        }}>
          <h1 style={{
            fontSize: `${18 * scale}px`, fontWeight: 900, letterSpacing: '0.1em',
            margin: 0, color: style.titleText, textTransform: 'uppercase',
          }}>
            {displayTr.pageTitle}
          </h1>
          <p style={{
            fontSize: `${7 * scale}px`, marginTop: `${1.2 * scale}mm`,
            color: style.subtitleText, opacity: 0.9, letterSpacing: '0.08em',
            textTransform: 'uppercase', fontWeight: 700,
          }}>
            {displayTr.productsContaining}
          </p>
        </div>

        {/* Matrix Table */}
        <table data-allergen-table style={{
          width: '100%', borderCollapse: 'collapse',
          fontSize: `${7 * scale}px`, tableLayout: 'fixed',
        }}>
          <thead>
            <tr>
              {/* Dish name column header */}
              <th style={{
                width: `${DISH_COL_W_MM * scale}mm`,
                height: `${MATRIX_HEADER_H_MM * scale}mm`,
                padding: `${1.4 * scale}mm ${2 * scale}mm`,
                background: style.headerBg, color: style.headerText,
                border: `1px solid ${style.strongBorderColor}`,
                textAlign: 'center', fontWeight: 800, fontSize: `${10 * scale}px`,
                lineHeight: 1.15, textTransform: 'uppercase', letterSpacing: '0.04em',
                verticalAlign: 'bottom', overflow: 'hidden',
              }}>
                <span>{displayTr.productsContaining}</span>
              </th>
              {/* Allergen columns */}
              {EU_ALLERGENS.map(ag => {
                const name = (displayTr as any)[ag.key] || ag.id;
                return (
                  <th key={ag.id} style={{
                    width: `${ALLERGEN_COL_W_MM * scale}mm`,
                    height: `${MATRIX_HEADER_H_MM * scale}mm`,
                    padding: `${1 * scale}mm ${0.5 * scale}mm`,
                    background: style.headerBg, color: style.headerText,
                    border: `1px solid ${style.strongBorderColor}`,
                    textAlign: 'center', fontWeight: 700, fontSize: `${6.2 * scale}px`,
                    verticalAlign: 'bottom', overflow: 'hidden',
                  }}>
                    {/* Icon circle */}
                    <div style={{
                      display: 'inline-flex', width: `${8.2 * scale}mm`, height: `${8.2 * scale}mm`,
                      borderRadius: '50%', alignItems: 'center', justifyContent: 'center',
                      fontSize: `${5.8 * scale}px`, fontWeight: 900, color: '#fff',
                      background: ag.color, marginBottom: `${0.55 * scale}mm`,
                      border: `${1.2 * scale}px solid rgba(255,255,255,0.72)`,
                      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
                    }}>{ag.symbol}</div>
                    {/* Allergen name */}
                    <div style={{ fontWeight: 700, letterSpacing: 0, lineHeight: 1.05, overflow: 'hidden' }}>{name}</div>
                    <div style={{ fontSize: `${5 * scale}px`, lineHeight: 1.1, marginTop: `${0.4 * scale}mm`, color: style.textColor, opacity: 0.72 }}>{ag.number}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {dishes.map((fd, ri) => {
              const isEven = ri % 2 === 1;
              const userAlls = dishAllergens[fd.dish.id] || fd.userAllergens;
              return (
                <tr key={fd.dish.id}>
                  {/* Dish name cell */}
                  <td style={{
                    height: `${MATRIX_ROW_H_MM * scale}mm`,
                    border: `1px solid ${style.borderColor}`,
                    padding: `${0.7 * scale}mm ${1.6 * scale}mm`,
                    verticalAlign: 'middle', fontWeight: 500,
                    overflow: 'hidden',
                    width: `${DISH_COL_W_MM * scale}mm`, fontSize: `${7.6 * scale}px`,
                    lineHeight: 1.15,
                    background: isEven ? style.rowEvenBg : style.rowOddBg,
                    color: style.textColor,
                  }}>
                    <span style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      whiteSpace: 'normal',
                    }}>
                      {fd.dish.name}
                    </span>
                  </td>
                  {/* Allergen cells */}
                  {EU_ALLERGENS.map(ag => {
                    const hasIt = userAlls.has(ag.id);
                    return (
                      <td key={ag.id} style={{
                        height: `${MATRIX_ROW_H_MM * scale}mm`,
                        border: `1px solid ${style.borderColor}`,
                        textAlign: 'center', padding: 0,
                        verticalAlign: 'middle', background: isEven ? style.rowEvenBg : style.rowOddBg,
                        cursor: isInteractive ? 'pointer' : 'default',
                        width: `${ALLERGEN_COL_W_MM * scale}mm`, minWidth: 0,
                      }}
                      onClick={() => isInteractive && onToggle(fd.dish.id, ag.id)}
                      >
                        {hasIt ? (
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: `${5.6 * scale}mm`, height: `${5.6 * scale}mm`,
                            borderRadius: '50%',
                            background: ag.color, color: '#fff',
                            fontSize: `${5.5 * scale}px`, fontWeight: 900,
                            boxShadow: `0 1px 3px rgba(0,0,0,0.15)`,
                          }}>✓</div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Fill empty rows to maintain consistent height */}
            {Array.from({ length: ROWS_PER_PAGE - dishes.length }).map((_, ei) => {
              const isEven = (dishes.length + ei) % 2 === 1;
              return (
                <tr key={`empty-${ei}`}>
                  <td style={{
                    height: `${MATRIX_ROW_H_MM * scale}mm`,
                    border: `1px solid ${style.borderColor}`, padding: `${0.7 * scale}mm ${1.6 * scale}mm`,
                    opacity: 0.15, background: isEven ? style.rowEvenBg : style.rowOddBg,
                  }}>&nbsp;</td>
                  {EU_ALLERGENS.map(ag => (
                    <td key={ag.id} style={{
                      height: `${MATRIX_ROW_H_MM * scale}mm`,
                      border: `1px solid ${style.borderColor}`,
                      background: isEven ? style.rowEvenBg : style.rowOddBg,
                    }}>&nbsp;</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Legend — compact 3-column grid so the matrix can fit more dish rows. */}
        <div data-allergen-legend style={{
          marginTop: `${LEGEND_TOP_MM * scale}mm`,
          display: 'grid', gridTemplateColumns: `repeat(3, 1fr)`,
          gap: `${1.15 * scale}mm ${4 * scale}mm`,
          justifyContent: 'stretch', background: style.legendBg,
          padding: `${2.6 * scale}mm ${3.4 * scale}mm`,
          borderRadius: `${1.5 * scale}mm`, border: `1px solid ${style.borderColor}`,
          alignItems: 'start',
        }}>
          {EU_ALLERGENS.map(ag => {
            const name = (displayTr as any)[ag.key] || ag.id;
            const desc = (displayTr as any)[ag.descKey] || '';
            return (
              <div key={ag.id} style={{
                minHeight: `${5.2 * scale}mm`,
                fontSize: `${6.55 * scale}px`, color: style.legendText,
                display: 'block',
                lineHeight: 1.2,
              }}>
                <span style={{ color: style.headerText, fontWeight: 900 }}>{ag.number}. </span>
                <b style={{ color: style.headerText, fontWeight: 800 }}>{name}</b>: {desc}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
