/**
 * Vignettes des réglages « visuels » du back-office (façon Houzez) : un
 * schéma par option, dessiné en SVG (pas d'image à maintenir).
 */
const W = 240, H = 130;
const BLUE = "#1e3a8a", ORANGE = "#ea580c", LINE = "#cbd5e1", PHOTO = "#94a3b8", SOFT = "#e2e8f0";

const Photo = (p: { x: number; y: number; w: number; h: number }) => (
  <g>
    <rect {...p} rx={3} fill={PHOTO} />
    <path d={`M${p.x + p.w * 0.15} ${p.y + p.h * 0.85} l${p.w * 0.25} -${p.h * 0.35} l${p.w * 0.18} ${p.h * 0.2} l${p.w * 0.12} -${p.h * 0.12} l${p.w * 0.2} ${p.h * 0.27}Z`} fill="#cbd5e1" />
  </g>
);
const Dots = ({ x, y, n = 4, gap = 16, color = LINE, w = 10 }: { x: number; y: number; n?: number; gap?: number; color?: string; w?: number }) => (
  <g>{Array.from({ length: n }, (_, i) => <rect key={i} x={x + i * gap} y={y} width={w} height={3} rx={1.5} fill={color} />)}</g>
);
const Logo = ({ x, y, color = BLUE }: { x: number; y: number; color?: string }) => (
  <g><circle cx={x + 5} cy={y + 4} r={4} fill="none" stroke={color} strokeWidth={2} /><rect x={x + 12} y={y + 1} width={24} height={6} rx={2} fill={color} /></g>
);
const Btn = ({ x, y, w = 30 }: { x: number; y: number; w?: number }) => <rect x={x} y={y} width={w} height={10} rx={3} fill={ORANGE} />;
const Page = ({ y }: { y: number }) => (
  <g>
    <rect x={14} y={y} width={120} height={6} rx={2} fill={SOFT} />
    <rect x={14} y={y + 12} width={212} height={H - y - 20} rx={4} fill="#f8fafc" stroke={SOFT} />
  </g>
);

function header(v: string) {
  switch (v) {
    case "dark":
      return (<><rect width={W} height={26} fill={BLUE} /><Logo x={12} y={9} color="#fff" /><Dots x={80} y={12} color="#93c5fd" /><Btn x={196} y={8} /><Page y={40} /></>);
    case "contacts":
      return (<><rect width={W} height={30} fill="#fff" /><Logo x={12} y={11} />
        {[90, 140, 190].map((x) => <g key={x}><circle cx={x} cy={15} r={4} fill="none" stroke={BLUE} strokeWidth={1.5} /><rect x={x + 7} y={11} width={26} height={3} rx={1.5} fill={LINE} /><rect x={x + 7} y={17} width={18} height={3} rx={1.5} fill={SOFT} /></g>)}
        <rect y={30} width={W} height={18} fill={BLUE} /><Dots x={20} y={37} color="#93c5fd" /><Btn x={196} y={34} /><Page y={60} /></>);
    case "centered":
      return (<><rect width={W} height={30} fill="#fff" /><Dots x={12} y={14} n={4} gap={9} w={5} color={BLUE} /><Logo x={100} y={11} /><Btn x={196} y={10} />
        <rect y={30} width={W} height={18} fill={BLUE} /><Dots x={78} y={37} color="#93c5fd" /><Page y={60} /></>);
    default:
      return (<><rect width={W} height={26} fill="#fff" stroke={SOFT} /><Logo x={12} y={9} /><Dots x={80} y={12} /><Btn x={196} y={8} /><Page y={40} /></>);
  }
}

function banner(v: string) {
  const top = (<><rect x={10} y={8} width={110} height={6} rx={2} fill={BLUE} /><rect x={196} y={8} width={34} height={6} rx={2} fill={ORANGE} /></>);
  switch (v) {
    case "wide":
      return (<>{top}<Photo x={10} y={20} w={220} h={78} />{[0, 1, 2, 3, 4, 5].map((i) => <Photo key={i} x={10 + i * 37} y={102} w={33} h={20} />)}</>);
    case "split":
      return (<>{top}<Photo x={10} y={20} w={146} h={102} /><Photo x={160} y={20} w={70} h={49} /><Photo x={160} y={73} w={70} h={49} /></>);
    case "collage":
      return (<>{top}<Photo x={10} y={20} w={72} h={102} /><Photo x={86} y={20} w={70} h={49} /><Photo x={86} y={73} w={70} h={49} /><Photo x={160} y={20} w={70} h={49} /><Photo x={160} y={73} w={70} h={49} /></>);
    default:
      return (<>{top}<Photo x={10} y={20} w={108} h={102} />{[0, 1].map((r) => [0, 1].map((c) => <Photo key={`${r}${c}`} x={122 + c * 55} y={20 + r * 53} w={51} h={49} />))}</>);
  }
}

function search(v: string) {
  const head = (<><rect width={W} height={24} fill="#fff" stroke={SOFT} /><Logo x={12} y={8} /><Dots x={80} y={11} /><Btn x={196} y={7} /></>);
  if (v === "none") return (<>{head}<Page y={38} /><text x={W / 2} y={92} textAnchor="middle" fontSize={11} fill="#94a3b8" fontFamily="Arial">Pas de barre</text></>);
  return (
    <>
      {head}
      <rect y={24} width={W} height={26} fill="#f1f5f9" />
      {v === "simple" ? (
        <><rect x={10} y={30} width={130} height={14} rx={4} fill="#fff" stroke={LINE} /><rect x={144} y={30} width={50} height={14} rx={4} fill="#fff" stroke={LINE} /></>
      ) : (
        <><rect x={10} y={30} width={90} height={14} rx={4} fill="#fff" stroke={LINE} />
          {[104, 136, 168].map((x) => <rect key={x} x={x} y={30} width={28} height={14} rx={4} fill="#fff" stroke={LINE} />)}</>
      )}
      <rect x={200} y={30} width={30} height={14} rx={4} fill={ORANGE} />
      <Page y={60} />
    </>
  );
}

function results(field: string, v: string) {
  const head = (<><rect width={W} height={18} fill="#fff" stroke={SOFT} /><Logo x={10} y={5} /><Dots x={90} y={8} /></>);
  const card = (x: number, y: number, w: number, h: number) => (<g key={`${x}-${y}`}><Photo x={x} y={y} w={w} h={h * 0.62} /><rect x={x} y={y + h * 0.68} width={w * 0.8} height={4} rx={2} fill={LINE} /><rect x={x} y={y + h * 0.84} width={w * 0.5} height={4} rx={2} fill={ORANGE} /></g>);
  const row = (y: number, w: number) => (<g key={y}><Photo x={10} y={y} w={46} h={28} /><rect x={62} y={y + 4} width={w} height={5} rx={2} fill={LINE} /><rect x={62} y={y + 14} width={w * 0.6} height={4} rx={2} fill={SOFT} /><rect x={62} y={y + 22} width={34} height={4} rx={2} fill={ORANGE} /></g>);
  const map = (<><rect x={134} y={24} width={96} height={100} rx={4} fill="#dbeafe" /><path d="M134 70 Q160 55 180 72 T230 60" stroke="#93c5fd" strokeWidth={6} fill="none" />
    {[[150, 44], [190, 52], [170, 90], [206, 100], [156, 108]].map(([x, y]) => <rect key={x + "" + y} x={x} y={y} width={20} height={9} rx={4.5} fill={BLUE} stroke="#fff" />)}</>);
  if (field === "resultsLayout") {
    return v === "list"
      ? (<>{head}{[26, 60, 94].map((y) => row(y, 150))}</>)
      : (<>{head}{[10, 66, 122, 178].map((x) => card(x, 26, 50, 46))}{[10, 66, 122, 178].map((x) => card(x, 78, 50, 46))}</>);
  }
  return v === "halfmap"
    ? (<>{head}{card(10, 24, 56, 48)}{card(72, 24, 56, 48)}{card(10, 76, 56, 48)}{card(72, 76, 56, 48)}{map}</>)
    : (<>{head}{[10, 66, 122, 178].map((x) => card(x, 26, 50, 46))}{[10, 66, 122, 178].map((x) => card(x, 78, 50, 46))}</>);
}

function provider(v: string) {
  const color = v === "google" ? "#4285f4" : v === "mapbox" ? "#111827" : "#7ebc6f";
  return (
    <>
      <rect width={W} height={H} fill={v === "mapbox" ? "#e5e7eb" : "#eef6e8"} />
      <path d="M0 80 Q60 50 120 78 T240 64" stroke={v === "google" ? "#fbbf24" : "#fff"} strokeWidth={9} fill="none" />
      <path d="M70 0 L90 130" stroke="#fff" strokeWidth={6} />
      <rect x={150} y={20} width={60} height={34} rx={4} fill={v === "mapbox" ? "#cbd5e1" : "#d9f0cf"} />
      <path d="M120 40c-9 0-15 7-15 15 0 11 15 26 15 26s15-15 15-26c0-8-6-15-15-15Z" fill={color} />
      <circle cx={120} cy={55} r={5} fill="#fff" />
      <text x={W / 2} y={H - 12} textAnchor="middle" fontSize={13} fontWeight={700} fill="#0f172a" fontFamily="Arial">{v === "google" ? "Google Maps" : v === "mapbox" ? "Mapbox" : "OpenStreetMap"}</text>
    </>
  );
}

/** Écran de téléphone (en-tête et menu du bas façon application). */
const Phone = ({ children }: { children: React.ReactNode }) => (
  <g>
    <rect x={80} y={4} width={80} height={122} rx={10} fill="#fff" stroke={LINE} strokeWidth={2} />
    {children}
  </g>
);
const PhoneBody = ({ y, h }: { y: number; h: number }) => (
  <g><Photo x={88} y={y} w={64} h={h * 0.55} /><rect x={88} y={y + h * 0.62} width={50} height={4} rx={2} fill={SOFT} /><rect x={88} y={y + h * 0.75} width={36} height={4} rx={2} fill={SOFT} /></g>
);
const Pill = ({ x, y, w }: { x: number; y: number; w: number }) => <g><rect x={x} y={y} width={w} height={11} rx={5.5} fill="#fff" /><circle cx={x + 7} cy={y + 5.5} r={2.2} fill={ORANGE} /><rect x={x + 13} y={y + 4} width={w * 0.45} height={3} rx={1.5} fill={LINE} /></g>;

function mobileHeader(v: string) {
  if (v === "classic") return (<Phone><rect x={82} y={10} width={76} height={18} fill="#fff" stroke={SOFT} /><Logo x={86} y={15} /><circle cx={150} cy={19} r={4} fill="none" stroke={LINE} strokeWidth={1.5} /><PhoneBody y={34} h={80} /></Phone>);
  if (v === "logo_search") return (<Phone><rect x={82} y={10} width={76} height={32} fill={BLUE} /><Logo x={86} y={14} color="#fff" /><circle cx={150} cy={18} r={4} fill="none" stroke="#fff" strokeWidth={1.5} /><Pill x={86} y={27} w={68} /><PhoneBody y={48} h={70} /></Phone>);
  return (<Phone><rect x={82} y={10} width={76} height={20} fill={BLUE} /><Dots x={86} y={15} n={3} gap={0} w={9} color="#fff" /><rect x={86} y={19} width={9} height={2} fill="#fff" /><rect x={86} y={23} width={9} height={2} fill="#fff" /><Pill x={99} y={14} w={55} /><PhoneBody y={36} h={80} /></Phone>);
}

function mobileBar(v: string) {
  const tabs = [96, 112, 128, 144];
  const icon = (x: number, y: number, on = false) => <rect key={x} x={x - 4} y={y} width={8} height={8} rx={2} fill={on ? BLUE : LINE} />;
  const label = (x: number, y: number) => <rect key={"l" + x} x={x - 5} y={y} width={10} height={2.5} rx={1} fill={SOFT} />;
  const body = <PhoneBody y={14} h={78} />;
  if (v === "floating") return (<Phone>{body}<rect x={86} y={100} width={68} height={18} rx={6} fill="#fff" stroke={LINE} />{tabs.map((x, i) => icon(x, 105, i === 0))}</Phone>);
  if (v === "publish") return (<Phone>{body}<rect x={82} y={104} width={76} height={18} fill="#fff" stroke={SOFT} />{[94, 108, 132, 146].map((x, i) => icon(x, 108, i === 0))}<circle cx={120} cy={106} r={7} fill={ORANGE} stroke="#fff" strokeWidth={2} /></Phone>);
  return (<Phone>{body}<rect x={82} y={102} width={76} height={20} fill="#fff" stroke={SOFT} />{tabs.map((x, i) => icon(x, 105, i === 0))}{v === "labels" ? tabs.map((x) => label(x, 116)) : null}</Phone>);
}

export function VisualThumb({ field, value }: { field: string; value: string }) {
  const draw = field === "mobileHeaderStyle" ? mobileHeader(value) : field === "mobileBottomBarStyle" ? mobileBar(value) : field === "headerStyle" ? header(value) : field === "bannerStyle" ? banner(value) : field === "headerSearch" ? search(value)
    : field === "resultsView" || field === "resultsLayout" ? results(field, value) : field === "provider" ? provider(value) : null;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full rounded bg-white" aria-hidden="true">
      {draw}
    </svg>
  );
}
