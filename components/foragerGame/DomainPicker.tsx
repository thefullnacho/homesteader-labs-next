'use client';

import Link from 'next/link';
import { Cherry, Sparkles, Leaf, Shuffle } from 'lucide-react';
import BrutalistBlock from '@/components/ui/BrutalistBlock';
import type { PlayMode } from '@/lib/foragerGame/types';

interface DomainOption {
  key: PlayMode;
  label: string;
  sub: string;
  icon: React.ReactNode;
}

const ICON_SIZE = 22;
const ICON_CLASS = 'text-accent shrink-0 mt-1';

const DOMAINS: DomainOption[] = [
  { key: 'mixed',                label: 'Mixed',                   sub: 'All four domains shuffled together',     icon: <Shuffle  size={ICON_SIZE} className={ICON_CLASS} /> },
  { key: 'berry',                label: 'Wild Berries',            sub: 'Edibles + deadly lookalikes',            icon: <Cherry   size={ICON_SIZE} className={ICON_CLASS} /> },
  { key: 'mushroom_highvalue',   label: 'Edible Mushrooms',        sub: 'Chanterelles, morels, lion’s mane',      icon: <span className={ICON_CLASS} style={{ fontSize: ICON_SIZE }}>🍄</span> },
  { key: 'mushroom_mycologist',  label: 'Psilocybes + Lookalikes', sub: 'Most visually confusing fungi',          icon: <Sparkles size={ICON_SIZE} className={ICON_CLASS} /> },
  { key: 'medicinal',            label: 'Wild Medicinals',         sub: 'Herbal remedies + deadly plants',        icon: <Leaf     size={ICON_SIZE} className={ICON_CLASS} /> },
];

export default function DomainPicker() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {DOMAINS.map(d => (
        <Link
          key={d.key}
          href={`/tools/forager-game/play/?mode=${d.key}`}
          className="block"
          data-mode={d.key}
        >
          <BrutalistBlock>
            <div className="flex items-start gap-3">
              {d.icon}
              <div className="flex-1">
                <p className="font-mono font-bold uppercase text-sm">{d.label}</p>
                <p className="text-[10px] font-mono opacity-60 mt-1 uppercase tracking-wider">{d.sub}</p>
              </div>
              <span className="text-accent text-lg font-mono">→</span>
            </div>
          </BrutalistBlock>
        </Link>
      ))}
    </div>
  );
}
