'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

/* ───────────────────────── Кольори бренду ───────────────────────── */
const NAVY = '#0E1A2B'
const NAVY2 = '#14253B'
const GOLD = '#EF9F27'
const GOLD_DARK = '#B5710C'
const GOLD_LIGHT = '#FAC775'
const CREAM = '#FFF8EE'
const TEXT_SOFT = '#B5D4F4'
const GREEN = '#2E8B57'
const RED_SOFT = '#E0484D'

/* ───────────────────────── Картинки (60) ───────────────────────── */
type ShapeKey =
  | 'sun' | 'flower' | 'cat' | 'fish' | 'house' | 'tree'
  | 'star' | 'butterfly' | 'mushroom' | 'heart' | 'bird' | 'ball'
  | 'cloud' | 'moon' | 'apple' | 'leaf' | 'balloon' | 'umbrella'
  | 'cup' | 'car' | 'boat' | 'key' | 'bell' | 'rabbit'
  | 'bee' | 'snail' | 'frog' | 'carrot' | 'strawberry' | 'ladybug'
  | 'dog' | 'bear' | 'mouse' | 'owl' | 'turtle' | 'duck'
  | 'pear' | 'lemon' | 'cherry' | 'grape' | 'rainbow' | 'snowflake'
  | 'gift' | 'candle' | 'drop' | 'hedgehog' | 'pig' | 'sheep'
  | 'penguin' | 'crab' | 'elephant' | 'snake' | 'tomato' | 'pumpkin'
  | 'watermelon' | 'orange' | 'plane' | 'rocket' | 'clock' | 'book'

const SHAPE_NAMES: Record<ShapeKey, string> = {
  sun: 'Сонечко', flower: 'Квітка', cat: 'Котик', fish: 'Рибка',
  house: 'Будиночок', tree: 'Дерево', star: 'Зірочка', butterfly: 'Метелик',
  mushroom: 'Грибок', heart: 'Сердечко', bird: 'Пташка', ball: 'М’ячик',
  cloud: 'Хмаринка', moon: 'Місяць', apple: 'Яблучко', leaf: 'Листочок',
  balloon: 'Кулька', umbrella: 'Парасолька', cup: 'Горнятко', car: 'Машинка',
  boat: 'Човник', key: 'Ключик', bell: 'Дзвоник', rabbit: 'Зайчик',
  bee: 'Бджілка', snail: 'Равлик', frog: 'Жабка', carrot: 'Морквинка',
  strawberry: 'Полуничка', ladybug: 'Жучок',
  dog: 'Песик', bear: 'Ведмедик', mouse: 'Мишка', owl: 'Сова',
  turtle: 'Черепашка', duck: 'Каченя', pear: 'Грушка', lemon: 'Лимончик',
  cherry: 'Вишенька', grape: 'Виноград', rainbow: 'Веселка', snowflake: 'Сніжинка',
  gift: 'Подарунок', candle: 'Свічка', drop: 'Краплинка',
  hedgehog: 'Їжачок', pig: 'Поросятко', sheep: 'Овечка', penguin: 'Пінгвін',
  crab: 'Крабик', elephant: 'Слоник', snake: 'Змійка', tomato: 'Помідор',
  pumpkin: 'Гарбуз', watermelon: 'Кавун', orange: 'Апельсин', plane: 'Літачок',
  rocket: 'Ракета', clock: 'Годинник', book: 'Книжка',
}

const ALL_SHAPES = Object.keys(SHAPE_NAMES) as ShapeKey[]

function Shape({ kind, size = 150 }: { kind: ShapeKey; size?: number }) {
  const c = { width: size, height: size, viewBox: '0 0 100 100' } as const
  const a = { 'aria-hidden': true } as const
  switch (kind) {
    case 'sun':
      return (<svg {...c} {...a}>
        {[...Array(8)].map((_, i) => { const g = (i * Math.PI) / 4
          return <line key={i} x1={50 + Math.cos(g) * 30} y1={50 + Math.sin(g) * 30} x2={50 + Math.cos(g) * 44} y2={50 + Math.sin(g) * 44} stroke={GOLD} strokeWidth="6" strokeLinecap="round" /> })}
        <circle cx="50" cy="50" r="24" fill={GOLD} /></svg>)
    case 'flower':
      return (<svg {...c} {...a}>
        <line x1="50" y1="50" x2="50" y2="92" stroke="#3FA66A" strokeWidth="6" strokeLinecap="round" />
        {[...Array(6)].map((_, i) => { const g = (i * Math.PI) / 3
          return <circle key={i} cx={50 + Math.cos(g) * 20} cy={42 + Math.sin(g) * 20} r="13" fill="#E86A92" /> })}
        <circle cx="50" cy="42" r="11" fill={GOLD} /></svg>)
    case 'cat':
      return (<svg {...c} {...a}>
        <polygon points="26,28 34,8 46,24" fill="#E8913F" /><polygon points="74,28 66,8 54,24" fill="#E8913F" />
        <circle cx="50" cy="56" r="32" fill="#E8913F" /><circle cx="40" cy="52" r="4.5" fill={NAVY} /><circle cx="60" cy="52" r="4.5" fill={NAVY} />
        <polygon points="46,62 54,62 50,68" fill="#B05B22" /></svg>)
    case 'fish':
      return (<svg {...c} {...a}>
        <ellipse cx="46" cy="50" rx="32" ry="20" fill="#3FA0C4" /><polygon points="74,50 94,36 94,64" fill="#2C7FA0" /><circle cx="34" cy="44" r="4" fill={NAVY} /></svg>)
    case 'house':
      return (<svg {...c} {...a}>
        <rect x="26" y="48" width="48" height="40" fill="#E8C57A" /><polygon points="20,48 50,18 80,48" fill="#C0563E" />
        <rect x="44" y="62" width="14" height="26" fill="#7A4A2A" /><rect x="32" y="56" width="10" height="10" fill={CREAM} /></svg>)
    case 'tree':
      return (<svg {...c} {...a}>
        <rect x="44" y="56" width="12" height="34" fill="#8A5A2A" /><circle cx="50" cy="40" r="26" fill="#3FA66A" />
        <circle cx="34" cy="50" r="16" fill="#4DBE7A" /><circle cx="66" cy="50" r="16" fill="#4DBE7A" /></svg>)
    case 'star':
      return (<svg {...c} {...a}><polygon points="50,10 61,38 92,40 67,58 76,88 50,70 24,88 33,58 8,40 39,38" fill={GOLD} /></svg>)
    case 'butterfly':
      return (<svg {...c} {...a}>
        <ellipse cx="32" cy="38" rx="18" ry="16" fill="#E8913F" /><ellipse cx="68" cy="38" rx="18" ry="16" fill="#E8913F" />
        <ellipse cx="34" cy="64" rx="14" ry="12" fill="#3FA0C4" /><ellipse cx="66" cy="64" rx="14" ry="12" fill="#3FA0C4" />
        <rect x="47" y="30" width="6" height="44" rx="3" fill={NAVY} /></svg>)
    case 'mushroom':
      return (<svg {...c} {...a}>
        <rect x="42" y="52" width="16" height="34" rx="6" fill="#F0E2C8" /><path d="M18 54 A32 32 0 0 1 82 54 Z" fill="#C0563E" />
        <circle cx="38" cy="42" r="4" fill={CREAM} /><circle cx="58" cy="38" r="5" fill={CREAM} /><circle cx="66" cy="48" r="3.5" fill={CREAM} /></svg>)
    case 'heart':
      return (<svg {...c} {...a}><path d="M50 84 C18 60 14 36 30 26 C42 18 50 30 50 30 C50 30 58 18 70 26 C86 36 82 60 50 84 Z" fill="#E0484D" /></svg>)
    case 'bird':
      return (<svg {...c} {...a}>
        <circle cx="50" cy="52" r="28" fill="#3FA0C4" /><circle cx="58" cy="44" r="4" fill={NAVY} />
        <polygon points="76,48 92,52 76,56" fill={GOLD} /><path d="M30 52 Q44 70 58 56" fill="#2C7FA0" /></svg>)
    case 'ball':
      return (<svg {...c} {...a}>
        <circle cx="50" cy="50" r="34" fill={GOLD} /><path d="M16 50 H84 M50 16 V84" stroke={NAVY} strokeWidth="4" /><circle cx="50" cy="50" r="34" fill="none" stroke={NAVY} strokeWidth="3" /></svg>)
    case 'cloud':
      return (<svg {...c} {...a}>
        <circle cx="36" cy="56" r="16" fill="#9FC6E8" /><circle cx="54" cy="48" r="20" fill="#9FC6E8" /><circle cx="70" cy="58" r="14" fill="#9FC6E8" /><rect x="34" y="56" width="40" height="16" rx="8" fill="#9FC6E8" /></svg>)
    case 'moon':
      return (<svg {...c} {...a}><path d="M62 18 A34 34 0 1 0 62 82 A26 26 0 0 1 62 18 Z" fill={GOLD_LIGHT} /></svg>)
    case 'apple':
      return (<svg {...c} {...a}>
        <path d="M50 32 C40 22 22 28 24 48 C26 70 42 84 50 84 C58 84 74 70 76 48 C78 28 60 22 50 32 Z" fill="#D8424A" />
        <rect x="48" y="20" width="4" height="14" rx="2" fill="#7A4A2A" /><path d="M52 26 Q66 18 66 30 Q56 32 52 26 Z" fill="#3FA66A" /></svg>)
    case 'leaf':
      return (<svg {...c} {...a}>
        <path d="M22 78 C22 40 50 18 80 22 C82 54 56 80 22 78 Z" fill="#4DBE7A" /><path d="M30 70 Q52 48 76 28" stroke="#2E8B57" strokeWidth="3" fill="none" /></svg>)
    case 'balloon':
      return (<svg {...c} {...a}>
        <ellipse cx="50" cy="40" rx="26" ry="30" fill="#E86A92" /><polygon points="46,68 54,68 50,76" fill="#C0506F" /><path d="M50 76 Q56 86 48 92" stroke="#7A6A48" strokeWidth="2" fill="none" /></svg>)
    case 'umbrella':
      return (<svg {...c} {...a}>
        <path d="M16 52 A34 26 0 0 1 84 52 Z" fill="#3FA0C4" /><line x1="50" y1="52" x2="50" y2="84" stroke="#7A4A2A" strokeWidth="4" /><path d="M50 84 Q42 84 42 76" stroke="#7A4A2A" strokeWidth="4" fill="none" /></svg>)
    case 'cup':
      return (<svg {...c} {...a}>
        <path d="M28 36 H68 V60 A20 20 0 0 1 28 60 Z" fill="#E8913F" /><path d="M68 42 A12 12 0 0 1 68 64" stroke="#E8913F" strokeWidth="6" fill="none" />
        <path d="M40 26 Q44 30 40 34 M52 26 Q56 30 52 34" stroke="#9FC6E8" strokeWidth="3" fill="none" strokeLinecap="round" /></svg>)
    case 'car':
      return (<svg {...c} {...a}>
        <path d="M16 60 L24 44 H64 L80 60 Z" fill="#D8424A" /><rect x="16" y="58" width="64" height="14" rx="4" fill="#B5363D" />
        <circle cx="32" cy="74" r="8" fill={NAVY} /><circle cx="66" cy="74" r="8" fill={NAVY} /><rect x="34" y="48" width="22" height="10" rx="2" fill="#9FC6E8" /></svg>)
    case 'boat':
      return (<svg {...c} {...a}>
        <polygon points="50,16 50,56 78,56" fill="#E86A92" /><line x1="50" y1="14" x2="50" y2="58" stroke="#7A4A2A" strokeWidth="3" /><path d="M18 60 H82 L74 78 H26 Z" fill="#C0563E" /></svg>)
    case 'key':
      return (<svg {...c} {...a}>
        <circle cx="34" cy="40" r="16" fill="none" stroke={GOLD} strokeWidth="8" /><rect x="44" y="46" width="38" height="8" rx="2" fill={GOLD} />
        <rect x="70" y="54" width="8" height="12" fill={GOLD} /><rect x="58" y="54" width="6" height="10" fill={GOLD} /></svg>)
    case 'bell':
      return (<svg {...c} {...a}>
        <path d="M30 66 C30 44 36 30 50 30 C64 30 70 44 70 66 Z" fill={GOLD} /><rect x="26" y="66" width="48" height="8" rx="4" fill="#C97E14" />
        <circle cx="50" cy="80" r="6" fill="#C97E14" /><circle cx="50" cy="26" r="5" fill="#C97E14" /></svg>)
    case 'rabbit':
      return (<svg {...c} {...a}>
        <ellipse cx="40" cy="28" rx="7" ry="18" fill="#E8E2D8" /><ellipse cx="60" cy="28" rx="7" ry="18" fill="#E8E2D8" /><circle cx="50" cy="58" r="26" fill="#E8E2D8" />
        <circle cx="42" cy="54" r="4" fill={NAVY} /><circle cx="58" cy="54" r="4" fill={NAVY} /><circle cx="50" cy="62" r="3.5" fill="#E86A92" /></svg>)
    case 'bee':
      return (<svg {...c} {...a}>
        <ellipse cx="50" cy="56" rx="26" ry="20" fill={GOLD} /><rect x="40" y="38" width="8" height="36" fill={NAVY} /><rect x="56" y="38" width="8" height="36" fill={NAVY} />
        <ellipse cx="34" cy="40" rx="12" ry="8" fill="#DDEEFB" opacity="0.85" /><ellipse cx="66" cy="40" rx="12" ry="8" fill="#DDEEFB" opacity="0.85" /></svg>)
    case 'snail':
      return (<svg {...c} {...a}>
        <path d="M20 74 Q20 56 40 56 L60 56" stroke="#A8C58A" strokeWidth="10" fill="none" strokeLinecap="round" />
        <circle cx="56" cy="50" r="22" fill="none" stroke="#C0563E" strokeWidth="8" /><circle cx="56" cy="50" r="9" fill="#C0563E" />
        <line x1="22" y1="64" x2="18" y2="52" stroke="#A8C58A" strokeWidth="4" strokeLinecap="round" /></svg>)
    case 'frog':
      return (<svg {...c} {...a}>
        <circle cx="34" cy="34" r="11" fill="#4DBE7A" /><circle cx="66" cy="34" r="11" fill="#4DBE7A" /><circle cx="34" cy="34" r="4" fill={NAVY} /><circle cx="66" cy="34" r="4" fill={NAVY} />
        <ellipse cx="50" cy="60" rx="30" ry="22" fill="#4DBE7A" /><path d="M38 64 Q50 74 62 64" stroke="#2E8B57" strokeWidth="3" fill="none" strokeLinecap="round" /></svg>)
    case 'carrot':
      return (<svg {...c} {...a}>
        <polygon points="40,52 60,52 50,88" fill="#E8913F" /><path d="M44 50 L38 30 M50 50 L50 28 M56 50 L62 30" stroke="#3FA66A" strokeWidth="6" strokeLinecap="round" /></svg>)
    case 'strawberry':
      return (<svg {...c} {...a}>
        <path d="M50 34 C32 34 26 48 30 62 C34 78 50 88 50 88 C50 88 66 78 70 62 C74 48 68 34 50 34 Z" fill="#D8424A" />
        <path d="M38 34 Q50 24 62 34 Q56 40 50 38 Q44 40 38 34 Z" fill="#3FA66A" />
        <circle cx="44" cy="52" r="1.8" fill={GOLD_LIGHT} /><circle cx="56" cy="52" r="1.8" fill={GOLD_LIGHT} /><circle cx="50" cy="64" r="1.8" fill={GOLD_LIGHT} /></svg>)
    case 'ladybug':
      return (<svg {...c} {...a}>
        <ellipse cx="50" cy="56" rx="26" ry="24" fill="#D8424A" /><circle cx="50" cy="34" r="11" fill={NAVY} /><line x1="50" y1="34" x2="50" y2="80" stroke={NAVY} strokeWidth="3" />
        <circle cx="40" cy="52" r="4" fill={NAVY} /><circle cx="60" cy="52" r="4" fill={NAVY} /><circle cx="42" cy="68" r="4" fill={NAVY} /><circle cx="58" cy="68" r="4" fill={NAVY} /></svg>)
    case 'dog':
      return (<svg {...c} {...a}>
        <ellipse cx="28" cy="44" rx="9" ry="18" fill="#A9743E" /><ellipse cx="72" cy="44" rx="9" ry="18" fill="#A9743E" />
        <circle cx="50" cy="56" r="28" fill="#C68B4E" /><circle cx="40" cy="52" r="4.5" fill={NAVY} /><circle cx="60" cy="52" r="4.5" fill={NAVY} />
        <ellipse cx="50" cy="64" rx="6" ry="4.5" fill={NAVY} /></svg>)
    case 'bear':
      return (<svg {...c} {...a}>
        <circle cx="30" cy="30" r="11" fill="#9A6A3C" /><circle cx="70" cy="30" r="11" fill="#9A6A3C" />
        <circle cx="50" cy="56" r="30" fill="#B07E4A" /><circle cx="42" cy="52" r="4.5" fill={NAVY} /><circle cx="58" cy="52" r="4.5" fill={NAVY} />
        <ellipse cx="50" cy="66" rx="10" ry="8" fill="#E0CBA8" /><circle cx="50" cy="63" r="4" fill={NAVY} /></svg>)
    case 'mouse':
      return (<svg {...c} {...a}>
        <circle cx="30" cy="34" r="15" fill="#B9B6C0" /><circle cx="70" cy="34" r="15" fill="#B9B6C0" />
        <circle cx="50" cy="58" r="26" fill="#CFCCD6" /><circle cx="42" cy="54" r="4" fill={NAVY} /><circle cx="58" cy="54" r="4" fill={NAVY} /><circle cx="50" cy="62" r="3.5" fill="#E86A92" /></svg>)
    case 'owl':
      return (<svg {...c} {...a}>
        <ellipse cx="50" cy="56" rx="28" ry="30" fill="#A9743E" /><circle cx="40" cy="48" r="12" fill={CREAM} /><circle cx="60" cy="48" r="12" fill={CREAM} />
        <circle cx="40" cy="48" r="5" fill={NAVY} /><circle cx="60" cy="48" r="5" fill={NAVY} /><polygon points="46,56 54,56 50,64" fill={GOLD} />
        <polygon points="28,28 38,38 26,40" fill="#8A5A2A" /><polygon points="72,28 62,38 74,40" fill="#8A5A2A" /></svg>)
    case 'turtle':
      return (<svg {...c} {...a}>
        <ellipse cx="50" cy="54" rx="30" ry="22" fill="#3FA66A" /><path d="M30 54 A20 20 0 0 1 70 54 Z" fill="#2E8B57" />
        <line x1="50" y1="34" x2="50" y2="74" stroke="#256E45" strokeWidth="2" /><line x1="34" y1="48" x2="66" y2="48" stroke="#256E45" strokeWidth="2" />
        <circle cx="80" cy="50" r="9" fill="#4DBE7A" /><circle cx="82" cy="48" r="2.5" fill={NAVY} /></svg>)
    case 'duck':
      return (<svg {...c} {...a}>
        <circle cx="60" cy="38" r="15" fill={GOLD} /><ellipse cx="48" cy="62" rx="28" ry="20" fill={GOLD} />
        <circle cx="63" cy="34" r="3" fill={NAVY} /><polygon points="74,38 90,42 74,46" fill="#E8913F" /></svg>)
    case 'pear':
      return (<svg {...c} {...a}>
        <path d="M50 30 C44 30 42 40 44 46 C36 52 32 66 40 78 C48 90 60 88 64 76 C70 64 64 52 56 46 C58 40 56 30 50 30 Z" fill="#9FC44E" />
        <rect x="48" y="20" width="4" height="12" rx="2" fill="#7A4A2A" /></svg>)
    case 'lemon':
      return (<svg {...c} {...a}>
        <ellipse cx="50" cy="52" rx="32" ry="24" fill="#F2D03B" transform="rotate(-20 50 52)" />
        <circle cx="22" cy="40" r="3" fill="#D8B520" /><circle cx="80" cy="66" r="3" fill="#D8B520" /></svg>)
    case 'cherry':
      return (<svg {...c} {...a}>
        <circle cx="36" cy="68" r="13" fill="#D8424A" /><circle cx="64" cy="68" r="13" fill="#D8424A" />
        <path d="M36 56 Q50 20 64 56" stroke="#3FA66A" strokeWidth="4" fill="none" /><path d="M50 28 Q60 22 66 30" stroke="#3FA66A" strokeWidth="4" fill="none" /></svg>)
    case 'grape':
      return (<svg {...c} {...a}>
        {[[50,36],[40,48],[60,48],[32,60],[50,60],[68,60],[40,72],[58,72],[50,82]].map(([x, y], i) =>
          <circle key={i} cx={x} cy={y} r="9" fill="#8E6FC0" />)}
        <path d="M50 36 Q56 24 64 22" stroke="#7A4A2A" strokeWidth="3" fill="none" /></svg>)
    case 'rainbow':
      return (<svg {...c} {...a}>
        <path d="M16 74 A34 34 0 0 1 84 74" fill="none" stroke="#D8424A" strokeWidth="7" />
        <path d="M24 74 A26 26 0 0 1 76 74" fill="none" stroke={GOLD} strokeWidth="7" />
        <path d="M32 74 A18 18 0 0 1 68 74" fill="none" stroke="#3FA66A" strokeWidth="7" />
        <path d="M40 74 A10 10 0 0 1 60 74" fill="none" stroke="#3FA0C4" strokeWidth="7" /></svg>)
    case 'snowflake':
      return (<svg {...c} {...a}>
        {[0, 60, 120].map((d) => <line key={d} x1="50" y1="14" x2="50" y2="86" stroke="#8FC4E8" strokeWidth="5" strokeLinecap="round" transform={`rotate(${d} 50 50)`} />)}
        {[0, 60, 120].map((d) => <g key={'b' + d} transform={`rotate(${d} 50 50)`}>
          <line x1="50" y1="24" x2="42" y2="32" stroke="#8FC4E8" strokeWidth="4" strokeLinecap="round" />
          <line x1="50" y1="24" x2="58" y2="32" stroke="#8FC4E8" strokeWidth="4" strokeLinecap="round" /></g>)}</svg>)
    case 'gift':
      return (<svg {...c} {...a}>
        <rect x="24" y="46" width="52" height="38" rx="3" fill="#D8424A" /><rect x="20" y="36" width="60" height="14" rx="3" fill="#B5363D" />
        <rect x="44" y="36" width="12" height="48" fill={GOLD} /><path d="M50 36 Q36 22 30 32 Q34 40 50 38 Q66 40 70 32 Q64 22 50 36 Z" fill={GOLD} /></svg>)
    case 'candle':
      return (<svg {...c} {...a}>
        <rect x="40" y="44" width="20" height="42" rx="3" fill="#E8C57A" /><path d="M50 26 Q44 34 50 44 Q56 34 50 26 Z" fill={GOLD} /><circle cx="50" cy="36" r="3" fill="#FFF3DF" /></svg>)
    case 'drop':
      return (<svg {...c} {...a}><path d="M50 16 C50 16 26 50 26 64 A24 24 0 0 0 74 64 C74 50 50 16 50 16 Z" fill="#3FA0C4" /><ellipse cx="42" cy="62" rx="5" ry="8" fill="#9FC6E8" opacity="0.7" /></svg>)
    case 'hedgehog':
      return (<svg {...c} {...a}>
        {[...Array(11)].map((_, i) => { const x = 24 + i * 5
          return <line key={i} x1={x} y1="58" x2={x - 4} y2={34 + (i % 2) * 4} stroke="#7A5A38" strokeWidth="3" strokeLinecap="round" /> })}
        <path d="M22 58 A30 18 0 0 1 82 58 Z" fill="#9A7B52" />
        <ellipse cx="78" cy="60" rx="12" ry="9" fill="#C9A878" /><circle cx="84" cy="58" r="2.5" fill={NAVY} /><circle cx="88" cy="62" r="2.5" fill={NAVY} /></svg>)
    case 'pig':
      return (<svg {...c} {...a}>
        <polygon points="30,30 26,16 42,26" fill="#E89BB0" /><polygon points="70,30 74,16 58,26" fill="#E89BB0" />
        <circle cx="50" cy="56" r="30" fill="#F0A9BD" /><ellipse cx="50" cy="62" rx="14" ry="10" fill="#E07898" />
        <circle cx="45" cy="62" r="2.5" fill="#B0506C" /><circle cx="55" cy="62" r="2.5" fill="#B0506C" />
        <circle cx="40" cy="48" r="3.5" fill={NAVY} /><circle cx="60" cy="48" r="3.5" fill={NAVY} /></svg>)
    case 'sheep':
      return (<svg {...c} {...a}>
        {[[38,40],[50,34],[62,40],[32,52],[68,52],[40,62],[60,62],[50,66]].map(([x, y], i) =>
          <circle key={i} cx={x} cy={y} r="13" fill="#F0EEE8" />)}
        <ellipse cx="50" cy="58" rx="14" ry="13" fill="#6A6258" /><circle cx="45" cy="56" r="3" fill={CREAM} /><circle cx="55" cy="56" r="3" fill={CREAM} /></svg>)
    case 'penguin':
      return (<svg {...c} {...a}>
        <ellipse cx="50" cy="54" rx="24" ry="32" fill={NAVY} /><ellipse cx="50" cy="60" rx="15" ry="24" fill={CREAM} />
        <circle cx="42" cy="40" r="3.5" fill={CREAM} /><circle cx="58" cy="40" r="3.5" fill={CREAM} />
        <polygon points="46,46 54,46 50,54" fill={GOLD} /><ellipse cx="40" cy="86" rx="8" ry="4" fill={GOLD} /><ellipse cx="60" cy="86" rx="8" ry="4" fill={GOLD} /></svg>)
    case 'crab':
      return (<svg {...c} {...a}>
        <ellipse cx="50" cy="58" rx="26" ry="18" fill="#D8424A" />
        <circle cx="42" cy="48" r="4" fill={NAVY} /><circle cx="58" cy="48" r="4" fill={NAVY} />
        <path d="M24 56 Q12 50 16 40 Q24 44 28 52" fill="#C0383F" /><path d="M76 56 Q88 50 84 40 Q76 44 72 52" fill="#C0383F" />
        <line x1="30" y1="70" x2="22" y2="80" stroke="#D8424A" strokeWidth="3" /><line x1="70" y1="70" x2="78" y2="80" stroke="#D8424A" strokeWidth="3" /></svg>)
    case 'elephant':
      return (<svg {...c} {...a}>
        <circle cx="48" cy="48" r="26" fill="#9AA6B0" /><ellipse cx="26" cy="50" rx="14" ry="18" fill="#8A96A0" />
        <path d="M62 56 Q78 60 76 80 Q70 82 68 72 Q66 64 60 64 Z" fill="#9AA6B0" />
        <circle cx="44" cy="44" r="3.5" fill={NAVY} /><circle cx="58" cy="44" r="3.5" fill={NAVY} /></svg>)
    case 'snake':
      return (<svg {...c} {...a}>
        <path d="M24 78 Q48 78 44 58 Q40 40 56 38 Q72 36 70 22" fill="none" stroke="#4DBE7A" strokeWidth="11" strokeLinecap="round" />
        <circle cx="70" cy="22" r="8" fill="#3FA66A" /><circle cx="73" cy="20" r="2" fill={NAVY} />
        <line x1="70" y1="14" x2="70" y2="9" stroke="#D8424A" strokeWidth="2" /></svg>)
    case 'tomato':
      return (<svg {...c} {...a}>
        <circle cx="50" cy="58" r="28" fill="#D8424A" />
        <path d="M50 36 L42 26 M50 36 L58 26 M50 36 L50 24 M50 36 L40 32 M50 36 L60 32" stroke="#3FA66A" strokeWidth="4" strokeLinecap="round" />
        <circle cx="50" cy="34" r="5" fill="#2E8B57" /></svg>)
    case 'pumpkin':
      return (<svg {...c} {...a}>
        <ellipse cx="50" cy="60" rx="32" ry="24" fill="#E8913F" /><ellipse cx="50" cy="60" rx="18" ry="24" fill="#F0A24E" />
        <ellipse cx="30" cy="60" rx="10" ry="22" fill="#D8812F" /><ellipse cx="70" cy="60" rx="10" ry="22" fill="#D8812F" />
        <rect x="46" y="30" width="8" height="12" rx="3" fill="#6A8A3A" /></svg>)
    case 'watermelon':
      return (<svg {...c} {...a}>
        <path d="M16 30 A50 50 0 0 1 84 78 Z" fill="#3FA66A" transform="rotate(8 50 54)" />
        <path d="M22 34 A42 42 0 0 1 80 74 Z" fill="#E0484D" transform="rotate(8 50 54)" />
        <circle cx="42" cy="52" r="2.4" fill={NAVY} /><circle cx="54" cy="50" r="2.4" fill={NAVY} /><circle cx="52" cy="62" r="2.4" fill={NAVY} /></svg>)
    case 'orange':
      return (<svg {...c} {...a}>
        <circle cx="50" cy="54" r="30" fill="#F0902E" /><circle cx="40" cy="44" r="5" fill="#F7B05E" opacity="0.6" />
        <path d="M50 26 Q58 18 66 22 Q60 28 50 26 Z" fill="#3FA66A" /><rect x="48" y="22" width="4" height="6" fill="#7A4A2A" /></svg>)
    case 'plane':
      return (<svg {...c} {...a}>
        <path d="M20 52 L80 44 L88 50 L80 56 Z" fill="#9FC6E8" /><polygon points="40,48 56,28 50,48" fill="#3FA0C4" />
        <polygon points="40,52 56,72 50,52" fill="#3FA0C4" /><polygon points="74,46 84,38 80,48" fill="#2C7FA0" /></svg>)
    case 'rocket':
      return (<svg {...c} {...a}>
        <path d="M50 14 C62 26 62 50 58 64 H42 C38 50 38 26 50 14 Z" fill="#E8E8EC" />
        <circle cx="50" cy="38" r="7" fill="#3FA0C4" /><polygon points="42,58 30,72 42,68" fill="#D8424A" /><polygon points="58,58 70,72 58,68" fill="#D8424A" />
        <path d="M44 64 Q50 84 56 64 Z" fill={GOLD} /></svg>)
    case 'clock':
      return (<svg {...c} {...a}>
        <circle cx="50" cy="52" r="32" fill={CREAM} stroke="#7A6A48" strokeWidth="4" />
        <line x1="50" y1="52" x2="50" y2="32" stroke={NAVY} strokeWidth="4" strokeLinecap="round" /><line x1="50" y1="52" x2="66" y2="58" stroke={NAVY} strokeWidth="4" strokeLinecap="round" />
        <circle cx="50" cy="52" r="3" fill={GOLD_DARK} /></svg>)
    case 'book':
      return (<svg {...c} {...a}>
        <path d="M50 30 C40 24 26 24 20 28 V74 C26 70 40 70 50 76 Z" fill="#C0563E" />
        <path d="M50 30 C60 24 74 24 80 28 V74 C74 70 60 70 50 76 Z" fill="#D8704E" />
        <line x1="50" y1="30" x2="50" y2="76" stroke="#8A3A28" strokeWidth="3" /></svg>)
  }
}

/* ───────────────────────── Допоміжне ───────────────────────── */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const PRAISE = ['Чудово!', 'Влучно!', 'Так і є!', 'Чітко!', 'Браво!']

type Phase = 'intro' | 'countdown' | 'flash' | 'gap' | 'answer' | 'feedback'

const START_MS = 800
const DEMO_MS = 1500
const MIN_MS = 140
const MAX_MS = 1100
const LS_KEY = 'balabony_flash_best'
const RECENT_ROUNDS = 6 // не показувати ці ж картинки протягом N раундів

/* ───────────────────────── Аналітика ───────────────────────── */
function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ flex: '1 1 calc(50% - 4px)', minWidth: 0, background: '#fff', border: `1px solid ${GOLD_LIGHT}`, borderRadius: 12, padding: '8px 12px', textAlign: 'center' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#9A8C6E', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 700, color, marginTop: 2, fontFamily: "'Lora', serif", whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  )
}

/* ───────────────────────── Компонент ───────────────────────── */
export default function FlashGamePage() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [isDemo, setIsDemo] = useState(false)
  const [flashMs, setFlashMs] = useState(START_MS)
  const [target, setTarget] = useState<ShapeKey>('sun')
  const [options, setOptions] = useState<ShapeKey[]>([])
  const [count, setCount] = useState(3)
  const [picked, setPicked] = useState<ShapeKey | null>(null)
  const [correct, setCorrect] = useState(false)
  const [streak, setStreak] = useState(0)
  const [right, setRight] = useState(0)
  const [total, setTotal] = useState(0)
  const [best, setBest] = useState<number | null>(null)
  const [praise, setPraise] = useState('')

  const recent = useRef<ShapeKey[]>([])
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  useEffect(() => () => clearTimers(), [])

  useEffect(() => {
    try { const v = window.localStorage.getItem(LS_KEY); if (v) setBest(Number(v)) } catch {}
  }, [])

  const startRound = useCallback((demo: boolean) => {
    clearTimers()
    // пул без нещодавно показаних (і цілей, і варіантів)
    const excluded = new Set(recent.current)
    let pool = ALL_SHAPES.filter((s) => !excluded.has(s))
    if (pool.length < 4) pool = [...ALL_SHAPES]
    const shuffled = shuffle(pool)
    const t = shuffled[0]
    const others = shuffled.slice(1, 4)
    const opts = shuffle([t, ...others])
    // запам'ятати всі 4 показані картинки
    recent.current = [...opts, ...recent.current].slice(0, RECENT_ROUNDS * 4)
    setTarget(t)
    setOptions(opts)
    setPicked(null)
    setIsDemo(demo)
    setCount(3)
    setPhase('countdown')
  }, [])

  useEffect(() => {
    if (phase !== 'countdown') return
    clearTimers()
    let cc = 3
    setCount(3)
    const tick = () => {
      cc -= 1
      if (cc > 0) { setCount(cc); timers.current.push(setTimeout(tick, 750)) }
      else setPhase('flash')
    }
    timers.current.push(setTimeout(tick, 750))
  }, [phase])

  useEffect(() => {
    if (phase !== 'flash') return
    clearTimers()
    const dur = isDemo ? DEMO_MS : flashMs
    timers.current.push(setTimeout(() => setPhase('gap'), dur))
  }, [phase, isDemo, flashMs])

  useEffect(() => {
    if (phase !== 'gap') return
    clearTimers()
    timers.current.push(setTimeout(() => setPhase('answer'), 280))
  }, [phase])

  const answer = (key: ShapeKey) => {
    const ok = key === target
    setPicked(key)
    setCorrect(ok)
    setPraise(ok ? PRAISE[Math.floor(Math.random() * PRAISE.length)] : '')
    setPhase('feedback')
    if (isDemo) return
    setTotal((n) => n + 1)
    if (ok) {
      setRight((n) => n + 1)
      const ns = streak + 1
      setStreak(ns)
      if (best === null || flashMs < best) {
        setBest(flashMs)
        try { window.localStorage.setItem(LS_KEY, String(flashMs)) } catch {}
      }
      if (ns % 2 === 0) setFlashMs((ms) => Math.max(MIN_MS, ms - 70))
    } else {
      setStreak(0)
      setFlashMs((ms) => Math.min(MAX_MS, ms + 120))
    }
  }

  const next = () => {
    if (isDemo) { setIsDemo(false); setPhase('intro') }
    else startRound(false)
  }

  const reset = () => {
    clearTimers()
    recent.current = []
    setPhase('intro'); setIsDemo(false); setFlashMs(START_MS)
    setStreak(0); setRight(0); setTotal(0); setPicked(null)
  }

  const playing = phase !== 'intro'
  const sec = (ms: number) => `${(ms / 1000).toFixed(1).replace('.', ',')} c`

  return (
    <main lang="uk" style={{ minHeight: '100vh', background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY2} 50%, ${NAVY} 100%)`, padding: '32px 5% 64px', fontFamily: "'Montserrat', sans-serif", color: '#fff' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <nav style={{ marginBottom: 18, fontSize: 13, letterSpacing: 0.5 }}>
          <a href="/" style={{ color: GOLD, textDecoration: 'none' }}>Головна</a>
          <span style={{ color: 'rgba(255,255,255,0.35)', margin: '0 8px' }}>·</span>
          <span style={{ color: TEXT_SOFT }}>Ігри для мозку</span>
        </nav>

        <h1 style={{ fontFamily: "'Lora', serif", fontWeight: 600, fontSize: 'clamp(30px, 6vw, 44px)', margin: '0 0 10px', lineHeight: 1.15, color: GOLD }}>
          Що промайнуло?
        </h1>

        {/* Плашка наукової основи */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(239,159,39,0.08)', border: '1px solid rgba(239,159,39,0.4)', borderRadius: 14, padding: '12px 16px', margin: '4px 0 22px' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M12 2 L20 5 V11 C20 16 16.5 20 12 22 C7.5 20 4 16 4 11 V5 Z" /><path d="M9 12 l2 2 l4 -4" />
          </svg>
          <div>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: '#fff', lineHeight: 1.35 }}>Ґрунтується на методиці, яку у США досліджують понад 25 років</div>
            <div style={{ fontSize: 13, color: TEXT_SOFT, lineHeight: 1.4, marginTop: 3 }}>Клінічне дослідження ACTIVE за підтримки Національних інститутів здоров’я США (NIH) · 20-річні результати опубліковано у 2026 році</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: GOLD, lineHeight: 1.4, marginTop: 6 }}>Пов’язана з кращою увагою, швидкістю мислення та нижчим ризиком вікового зниження пам’яті.</div>
          </div>
        </div>

        <p style={{ color: TEXT_SOFT, fontSize: 18, lineHeight: 1.55, margin: '0 0 16px' }}>
          Проста вправа для уваги та швидкості мозку. Картинка з’явиться на коротку
          мить — а ви впізнаєте, що це було. Грайте спокійно, у своєму темпі: тут
          немає поспіху й немає програшу.
        </p>

        <p style={{ color: TEXT_SOFT, fontSize: 16.5, lineHeight: 1.6, margin: '0 0 26px' }}>
          <b style={{ color: GOLD }}>Що це дає.</b> У дослідженнях люди, які тренувалися,
          легше давали раду повсякденним справам і почувалися впевненіше — а користь
          трималася роками. <b style={{ color: GOLD }}>Головна порада науковців —
          регулярність:</b> грайте потроху, по 5–10 хвилин кілька разів на тиждень,
          спокійно й без оцінок. Що менше поспіху — то приємніше й корисніше.
          Докладніше про дослідження та межі — нижче.
        </p>

        {/* ───────── Ігрове поле ───────── */}
        <section style={{ background: CREAM, borderRadius: 24, border: `2px solid ${GOLD_LIGHT}`, padding: '28px 22px', color: NAVY, boxShadow: '0 18px 40px rgba(0,0,0,0.28)' }}>
          {playing && (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, maxWidth: 380, margin: '0 auto 22px' }}>
              <Stat label="Правильних" value={total > 0 ? `${right} / ${total}` : '0'} color={GREEN} />
              <Stat label="Показ" value={sec(flashMs)} color={NAVY} />
              {best !== null && <Stat label="Найкращий" value={sec(best)} color={GOLD_DARK} />}
            </div>
          )}

          <div style={{ minHeight: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            {/* INTRO */}
            {phase === 'intro' && (
              <div style={{ width: '100%' }}>
                <div style={{ marginBottom: 22 }}><Shape kind="butterfly" size={120} /></div>
                <p style={{ fontSize: 17, lineHeight: 1.6, margin: '0 0 22px', color: '#4A4234' }}>
                  Як грати: дивіться на крапку в центрі → з’явиться картинка на мить →
                  оберіть із чотирьох варіантів, що промайнуло. Час на відповідь необмежений.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                  <button onClick={() => startRound(false)} style={btnPrimary}>Почати</button>
                  <button onClick={() => startRound(true)} style={btnGhost}>Спершу пробний раунд</button>
                </div>
              </div>
            )}

            {/* COUNTDOWN */}
            {phase === 'countdown' && (
              <div>
                <p style={{ fontSize: 17, color: '#6A5F48', margin: '0 0 14px' }}>
                  {isDemo ? 'Пробний раунд. Дивіться на крапку…' : 'Дивіться на крапку…'}
                </p>
                <div style={{ fontFamily: "'Lora', serif", fontSize: 72, fontWeight: 700, color: GOLD_DARK, lineHeight: 1 }}>{count}</div>
                <div aria-hidden="true" style={{ width: 14, height: 14, borderRadius: '50%', background: NAVY, margin: '18px auto 0' }} />
              </div>
            )}

            {/* FLASH */}
            {phase === 'flash' && <div className="bb-flash-in"><Shape kind={target} size={160} /></div>}

            {/* GAP */}
            {phase === 'gap' && <div aria-hidden="true" style={{ width: 14, height: 14, borderRadius: '50%', background: NAVY }} />}

            {/* ANSWER / FEEDBACK */}
            {(phase === 'answer' || phase === 'feedback') && (
              <div style={{ width: '100%' }}>
                <p style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: GOLD_DARK, fontFamily: "'Lora', serif" }}>Що промайнуло?</p>
                {phase === 'answer' && <p style={{ fontSize: 14, color: '#7A6A48', margin: '0 0 16px' }}>Торкніться відповіді</p>}
                {phase === 'feedback' && <div style={{ height: 16 }} />}

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 12 }}>
                  {options.map((opt) => {
                    const isPicked = picked === opt
                    const isTarget = opt === target
                    let bg = '#fff'
                    let border = `2px solid ${GOLD_LIGHT}`
                    if (phase === 'feedback') {
                      if (isTarget) border = `3px solid ${GREEN}`
                      if (isPicked && !isTarget) { bg = '#FBE9E9'; border = `3px solid ${RED_SOFT}` }
                    }
                    return (
                      <button key={opt} onClick={() => phase === 'answer' && answer(opt)} disabled={phase === 'feedback'} className="bb-opt"
                        style={{
                          background: bg, border, borderRadius: 16, padding: '14px 10px',
                          fontSize: 'clamp(13px, 3.6vw, 16px)', fontWeight: 600, fontFamily: "'Montserrat', sans-serif",
                          color: NAVY, cursor: phase === 'answer' ? 'pointer' : 'default',
                          minHeight: 62, minWidth: 0, lineHeight: 1.25, boxSizing: 'border-box',
                        }}>
                        {SHAPE_NAMES[opt]}
                      </button>
                    )
                  })}
                </div>

                {phase === 'feedback' && (
                  <div aria-live="polite" style={{ marginTop: 20 }}>
                    {correct ? (
                      <p style={{ fontSize: 20, fontWeight: 700, color: GREEN, margin: '0 0 16px' }}>{praise} Це {SHAPE_NAMES[target].toLowerCase()}.</p>
                    ) : (
                      <p style={{ fontSize: 18, fontWeight: 600, color: '#4A4234', margin: '0 0 16px' }}>Це {SHAPE_NAMES[target].toLowerCase()}. Нічого, пробуймо далі.</p>
                    )}
                    <button onClick={next} style={btnNext}>{isDemo ? 'Почати гру →' : 'Далі →'}</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {playing && phase !== 'feedback' && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button onClick={reset} style={btnGhostDark}>Завершити сеанс</button>
          </div>
        )}

        {/* ───────── Докладніше ───────── */}
        <details style={detailsBox} className="bb-details">
          <summary style={summaryStyle}>Чи це справді працює? — докладно</summary>
          <div style={detailsBody}>
            <p><b>Що це за методика.</b> В основі — тренування «швидкості обробки» (speed of processing) з елементом розділеної уваги: треба швидко помітити й розпізнати зорову інформацію, що з’являється на короткий час. Методику розробили ще у 1990-х (тест Useful Field of View).</p>
            <p><b>На чому ґрунтується.</b> Дані взяті з дослідження ACTIVE — найбільшого у США дослідження різних типів когнітивного тренування в дорослих. Воно стартувало у 1998–1999 роках, охопило 2 802 особи віком від 65 років; учасників випадково розподілили на групи: тренування пам’яті, мислення, швидкості обробки або контрольну групу. Кожна група мала до 10 занять по 60–75 хвилин протягом 5–6 тижнів, частина — повторні («бустерні») сесії. Результати опубліковано у лютому 2026 року в журналі «Alzheimer’s &amp; Dementia: Translational Research &amp; Clinical Interventions».</p>
            <p><b>Що саме виявили.</b> Через 20 років у групи, яка тренувала швидкість і мала повторні сесії, виявили на 25% менше діагнозів деменції, ніж у контрольній — це був єдиний тип тренування з таким тривалим ефектом. На 10-му році ця ж група мала на 29% нижчу захворюваність. Раніші результати показували також менше труднощів у повсякденних справах і менше ДТП.</p>
            <p><b>Чому це працює.</b> Дослідники вважають, що тренування швидкості було особливо дієвим саме тому, що воно адаптивне — складність підлаштовувалася під рівень кожної людини. Тому й тут показ коротшає поступово, під ваш темп.</p>
            <p><b>Що кажуть учені.</b> Один із керівників дослідження, професор Майкл Марсіске (Університет Флориди), наголошує: навіть короткий курс тренування дав користь, що трималася два десятиліття — і саме тривалість ефекту здивувала дослідницьку команду.</p>
            <p><b>Що дає регулярне тренування — простими словами.</b> Мозок звикає «схоплювати» побачене швидше. На практиці це означає швидшу реакцію, легкість у повсякденних справах (читання, орієнтування, дрібні рішення), упевненіше відчуття за кермом — а в дослідженні ця користь трималася роками. Коротко: тренуєте те, як швидко й чітко мозок обробляє те, що бачать очі.</p>
            <p className="bb-cream-note"><b>Чесні межі.</b> Ефект був лише у тих, хто тренувався <i>і</i> ходив на повторні сесії — отже, працює регулярність, а не одна спроба. Діагнози рахували за медичними записами (наближена оцінка). Це <i>зв’язок</i>, а не обіцянка результату для конкретної людини. Одна зі співавторок пов’язана з компанією, що продає комерційну версію тренажера (кажемо це для прозорості). Наша гра — <b>не сертифікований медичний тренажер</b>, а проста вправа за тим самим принципом, і вона не замінює лікування чи реабілітацію.</p>
            <p><b>Підсумок.</b> Доказів достатньо, щоб спробувати — вправа безпечна й приємна. Але користь дає регулярність, а не разова гра. Сприймайте це як корисну звичку, а не ліки.</p>
          </div>
        </details>

        {/* ───────── FAQ ───────── */}
        <details style={detailsBox} className="bb-details">
          <summary style={summaryStyle}>Кому, скільки, як часто</summary>
          <div style={detailsBody}>
            <p><b>Кому підійде.</b> Практично будь-якому дорослому, хто хоче тренувати увагу та швидкість сприйняття — і у зрілому віці, і під час відновлення після стресу чи травми. Вікового обмеження зверху немає. Можна грати разом із рідними.</p>
            <p><b>Кому варто бути обережним або спершу порадитися з лікарем:</b> якщо була фотосенситивна епілепсія чи реакції на миготливі зображення; у гострий період після струсу/травми голови, при сильному головному болі чи запамороченні; якщо раптові появи на екрані викликають тривогу — тоді просто зупиніться. Гра не призначена для діагностики чи самолікування.</p>
            <p><b>Скільки грати за раз.</b> Орієнтовно 5–10 хвилин, не до втоми. Щойно відчули, що увага «попливла», — завершуйте. Коротко, але якісно краще, ніж довго через силу.</p>
            <p><b>Як часто.</b> Користь дає регулярність. Розумний орієнтир — 3–5 разів на тиждень короткими сеансами. Кілька тижнів поспіль дадуть більше, ніж марафон за один день.</p>
            <p><b>Коли краще.</b> Коли ви бадьорі й спокійні, наприклад удень. Не варто грати геть втомленим або перед сном.</p>
            <p><b>Чи це лікує?</b> Ні. Це тренувальна вправа для підтримки когнітивних функцій, а не ліки й не заміна реабілітації чи консультації лікаря.</p>
          </div>
        </details>

        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 22, lineHeight: 1.5 }}>
          Матеріал має інформаційний характер і не є медичною консультацією. За потреби звертайтеся до лікаря.
        </p>

        {/* ───────── Нижня навігація ───────── */}
        <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 28, borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 22 }}>
          <a href="/" style={navArrow}><span style={{ fontSize: 22, lineHeight: 1 }}>←</span><span>Головна</span></a>
          <a href="/stories" style={{ ...navArrow, textAlign: 'right' }}><span>Читати історії</span><span style={{ fontSize: 22, lineHeight: 1 }}>→</span></a>
        </nav>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        .bb-flash-in { animation: bbFlashIn 0.18s ease-out; }
        @keyframes bbFlashIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        details > summary { list-style: none; }
        details > summary::-webkit-details-marker { display: none; }
        .bb-details p { margin: 0 0 16px; }
        .bb-details p:last-child { margin-bottom: 0; }
        .bb-details b { color: ${GOLD}; }
        .bb-cream-note { background: #FFF3DF; border-radius: 12px; padding: 14px 16px; color: ${NAVY}; }
        .bb-cream-note b { color: ${GOLD_DARK}; }
        .bb-opt { hyphens: auto; -webkit-hyphens: auto; overflow-wrap: normal; word-break: normal; }
      `}</style>
    </main>
  )
}

/* ───────────────────────── Стилі ───────────────────────── */
const btnPrimary: React.CSSProperties = {
  background: GOLD, color: NAVY, border: `2px solid ${GOLD_LIGHT}`, borderRadius: 24,
  padding: '14px 34px', fontSize: 19, fontWeight: 700, fontFamily: "'Montserrat', sans-serif",
  cursor: 'pointer', maxWidth: '100%', boxSizing: 'border-box',
}
const btnNext: React.CSSProperties = { ...btnPrimary, padding: '15px 30px', whiteSpace: 'normal' }
const btnGhost: React.CSSProperties = {
  background: 'transparent', color: '#7A6A48', border: '2px solid rgba(122,106,72,0.35)', borderRadius: 24,
  padding: '11px 24px', fontSize: 16, fontWeight: 600, fontFamily: "'Montserrat', sans-serif",
  cursor: 'pointer', maxWidth: '100%', boxSizing: 'border-box',
}
const btnGhostDark: React.CSSProperties = {
  background: 'transparent', color: TEXT_SOFT, border: '1px solid rgba(181,212,244,0.4)', borderRadius: 22,
  padding: '9px 22px', fontSize: 14, fontWeight: 600, fontFamily: "'Montserrat', sans-serif", cursor: 'pointer',
}
const navArrow: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8, color: GOLD, fontWeight: 700, fontSize: 16,
  textDecoration: 'none', fontFamily: "'Montserrat', sans-serif",
}
const detailsBox: React.CSSProperties = {
  marginTop: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(239,159,39,0.3)', borderRadius: 16, overflow: 'hidden',
}
const summaryStyle: React.CSSProperties = {
  cursor: 'pointer', padding: '16px 20px', fontSize: 17, fontWeight: 700, color: GOLD, fontFamily: "'Montserrat', sans-serif",
}
const detailsBody: React.CSSProperties = {
  padding: '0 20px 18px', fontSize: 15.5, lineHeight: 1.65, color: TEXT_SOFT,
}
