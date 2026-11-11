import { useFrame } from '@react-three/fiber';
import { Sparkles, Text } from '@react-three/drei';
import { useRef } from 'react';

// Four original destinations. Colours and light are eased in while the fog hides the change.
// The props below are simple procedural geometry, not copied from any other game.
export const DESTINATIONS = [
  { name: 'Morning Energy Café', sky: '#8fd3ff', ground: '#5fae3b', path: '#8a5530', light: '#ffd9a0', hemi: '#fff1dc', props: 'cafe' },
  { name: 'Flavour Forest', sky: '#93d6f6', ground: '#4f9e33', path: '#7d4b29', light: '#e4f5c4', hemi: '#eaf7dd', props: 'forest' },
  { name: 'Price Bridge', sky: '#9fc6ff', ground: '#5a9a3e', path: '#8a5530', light: '#f2d9b8', hemi: '#dfe3f0', props: 'bridge' },
  { name: 'ChocoWarm Workshop', sky: '#f6c48f', ground: '#6a8f35', path: '#6e3f22', light: '#ffb878', hemi: '#ffe6c8', props: 'workshop' },
];

export const SEASON_THEMES = {
  Summer: {
    sky: '#8fd3ff', ground: '#5fae3b', path: '#8a5530',
    light: '#fff1c4', hemi: '#f2fbff', evergreen: '#2f6b2a',
    foliage: '#4f9e33', ornament: '#e8663a', bridge: '#a0672e',
  },
  Winter: {
    sky: '#b9dcf5', ground: '#f4f8fb', path: '#8a5530',
    light: '#fff2d7', hemi: '#e5eff9', evergreen: '#315b4a',
    foliage: '#477662', ornament: '#cf5d61', bridge: '#a8c4d7',
  },
  Monsoon: {
    sky: '#9fb7c9', ground: '#4f8a45', path: '#7a4a2a',
    light: '#d7e7ed', hemi: '#dce7e8', evergreen: '#355f4a',
    foliage: '#47765a', ornament: '#d9a447', bridge: '#687d78',
  },
  Spring: {
    sky: '#8fd3ff', ground: '#62b33e', path: '#8a5530',
    light: '#fff0c8', hemi: '#f2fbff', evergreen: '#2f6b2a',
    foliage: '#55a836', ornament: '#ff7aa8', bridge: '#a0672e',
  },
};

// ---- Morning Energy Café: a striped stall with rising steam ----
function Steam({ x, z, phase }) {
  const puff = useRef();
  useFrame((state) => {
    if (!puff.current) return;
    const t = (state.clock.elapsedTime * 0.45 + phase) % 1;
    puff.current.position.y = 1.5 + t * 1.5;
    puff.current.scale.setScalar(0.5 + t * 0.7);
    puff.current.material.opacity = (1 - t) * 0.35;
  });
  return <mesh ref={puff} position={[x, 1.5, z]}>
    <sphereGeometry args={[0.16, 10, 10]} />
    <meshStandardMaterial color="#fff8ef" transparent opacity={0.3} depthWrite={false} />
  </mesh>;
}

function CafeStall({ side }) {
  const stripes = ['#e8a25b', '#fff3e0', '#e8a25b', '#fff3e0', '#e8a25b'];
  return <group position={[side * 7.6, 0, -10]}>
    <mesh position={[0, 0.5, 0]} castShadow><boxGeometry args={[2.4, 1, 1.2]} /><meshStandardMaterial color="#6b4a33" roughness={0.7} /></mesh>
    <mesh position={[-1.25, 1.1, 0.4]}><cylinderGeometry args={[0.07, 0.07, 2.2, 6]} /><meshStandardMaterial color="#4a3324" /></mesh>
    <mesh position={[1.25, 1.1, 0.4]}><cylinderGeometry args={[0.07, 0.07, 2.2, 6]} /><meshStandardMaterial color="#4a3324" /></mesh>
    {stripes.map((color, i) => <mesh key={i} position={[-1.4 + i * 0.7, 2.15, 0.6]}>
      <boxGeometry args={[0.7, 0.16, 1.6]} />
      <meshStandardMaterial color={color} />
    </mesh>)}
    {[-0.6, 0, 0.6].map((x) => <mesh key={x} position={[x, 1.12, 0.2]}>
      <cylinderGeometry args={[0.2, 0.15, 0.3, 12]} />
      <meshStandardMaterial color="#fff3e0" />
    </mesh>)}
    <Steam x={-0.6} z={0.2} phase={0.1} />
    <Steam x={0.6} z={0.2} phase={0.6} />
  </group>;
}

function CafeProps() {
  return <group>
    <CafeStall side={-1} />
    <CafeStall side={1} />
  </group>;
}

// ---- Flavour Forest: swaying cocoa trees, mushrooms and fireflies ----
function Tree({ x, z, scale, seed, season = 'Spring' }) {
  const crown = useRef();
  const theme = SEASON_THEMES[season] ?? SEASON_THEMES.Spring;
  useFrame((state) => {
    if (crown.current) crown.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.8 + seed) * 0.03;
  });
  return <group position={[x, 0, z]} scale={scale}>
    <mesh position={[0, 0.9, 0]} castShadow><cylinderGeometry args={[0.12, 0.18, 1.8, 6]} /><meshStandardMaterial color="#6b4a33" /></mesh>
    <group ref={crown}>
      {[0, 1, 2].map((tier) => (
        <mesh key={tier} position={[0, 1.8 + tier * 0.62, 0]} castShadow>
          <coneGeometry args={[1.05 - tier * 0.2, 1.65, 8]} />
          <meshStandardMaterial color={tier % 2 ? theme.foliage : theme.evergreen} flatShading />
        </mesh>
      ))}
      {[0, 1, 2, 3, 4].map((ornament) => {
        const angle = ornament * 1.25 + seed;
        const y = 1.65 + (ornament % 3) * 0.62;
        const radius = 0.68 - (ornament % 3) * 0.15;
        return <mesh key={ornament} position={[Math.cos(angle) * radius, y, Math.sin(angle) * radius]} castShadow>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color={theme.ornament} metalness={0.2} roughness={0.35} />
        </mesh>;
      })}
      <mesh position={[0, 3.48, 0]}><octahedronGeometry args={[0.2]} /><meshStandardMaterial color="#ffe08a" emissive="#f5bd47" emissiveIntensity={0.5} /></mesh>
    </group>
  </group>;
}

function Mushroom({ x, z, scale }) {
  return <group position={[x, 0, z]} scale={scale}>
    <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.1, 0.13, 0.4, 8]} /><meshStandardMaterial color="#f1e6d2" /></mesh>
    <mesh position={[0, 0.42, 0]}><sphereGeometry args={[0.32, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#c96a4a" roughness={0.6} /></mesh>
    <mesh position={[0.12, 0.55, 0.1]}><sphereGeometry args={[0.05, 6, 6]} /><meshStandardMaterial color="#fff6e6" /></mesh>
  </group>;
}

function ForestProps({ season }) {
  return <group>
    {[[-7.8, -6, 1.0], [8.4, -7.5, 1.2], [-9.2, -13, 1.3], [8.8, -15, 1.0], [-8.4, -21, 1.1], [8.2, -22, 1.4]].map(([x, z, s], i) => (
      <Tree key={i} x={x} z={z} scale={s} seed={i} season={season} />
    ))}
    <Mushroom x={-5.6} z={-4} scale={1.1} />
    <Mushroom x={5.8} z={-11} scale={0.9} />
    <Mushroom x={-5.4} z={-19} scale={1.0} />
    <Sparkles count={30} scale={[14, 3, 30]} position={[0, 1.5, -14]} size={5} speed={0.3} opacity={0.8} color="#f4e27a" />
  </group>;
}

// ---- Price Bridge: an arch over the path with drifting coins ----
function Coin({ x, y, z, phase }) {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 2 + phase;
  });
  return <group ref={ref} position={[x, y, z]}>
    <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.22, 0.22, 0.05, 14]} /><meshStandardMaterial color="#f2c14e" metalness={0.6} roughness={0.3} emissive="#b8860b" emissiveIntensity={0.25} /></mesh>
  </group>;
}

function BridgeProps({ season }) {
  const bridgeColor = (SEASON_THEMES[season] ?? SEASON_THEMES.Spring).bridge;
  return <group position={[0, 0, -30]}>
    <mesh castShadow><torusGeometry args={[6.2, 0.28, 10, 36, Math.PI]} /><meshStandardMaterial color={bridgeColor} roughness={0.6} /></mesh>
    {[-6.2, 6.2].map((x) => <mesh key={x} position={[x, 0.9, 0]} castShadow>
      <boxGeometry args={[0.7, 1.8, 0.7]} />
      <meshStandardMaterial color={bridgeColor} />
    </mesh>)}
    {[[-3.2, 2.4, 0], [-1.2, 3.2, 0.4], [1.2, 3.2, 0.4], [3.2, 2.4, 0]].map(([x, y, z], i) => (
      <Coin key={i} x={x} y={y} z={z} phase={i} />
    ))}
  </group>;
}

// ---- ChocoWarm Workshop: turning gears, chocolate stacks and sparks ----
function Gear({ x, y, z, speed, color }) {
  const ref = useRef();
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * speed;
  });
  return <group ref={ref} position={[x, y, z]}>
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.8, 0.8, 0.25, 8]} /><meshStandardMaterial color={color} metalness={0.4} roughness={0.4} /></mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.3, 0.3, 0.32, 12]} /><meshStandardMaterial color="#4a3324" /></mesh>
  </group>;
}

function WorkshopProps() {
  return <group>
    <Gear x={-7.2} y={2.2} z={-10} speed={0.9} color="#c9873c" />
    <Gear x={-7.2} y={2.2} z={-14} speed={-0.7} color="#a86f38" />
    <Gear x={7.4} y={2.6} z={-12} speed={0.6} color="#c9873c" />
    {[0, 1, 2].map((i) => <mesh key={i} position={[7.6, 0.25 + i * 0.5, -17]} castShadow>
      <boxGeometry args={[1.4, 0.45, 0.9]} />
      <meshStandardMaterial color={i % 2 ? '#5a3a25' : '#6b4630'} roughness={0.8} />
    </mesh>)}
    <mesh position={[-7.6, 0.2, -18]} castShadow><boxGeometry args={[1.6, 0.4, 3]} /><meshStandardMaterial color="#4a3324" /></mesh>
    <Sparkles count={25} scale={[12, 4, 30]} position={[0, 2, -12]} size={4} speed={0.6} opacity={0.9} color="#ffbd54" />
  </group>;
}

const PROPS = {
  cafe: CafeProps,
  forest: ForestProps,
  bridge: BridgeProps,
  workshop: WorkshopProps,
};

// Each destination sits on the route at -index * ROUTE_SEG; the runner walks the route to reach it.
export const ROUTE_SEG = 80;

export function destinationFor(zoneIndex) {
  return Math.min(Math.max(Math.floor(zoneIndex), 0), DESTINATIONS.length - 1);
}

export function DestinationProps({ index, season = 'Spring' }) {
  const Props = PROPS[DESTINATIONS[index % DESTINATIONS.length].props];
  return <Props season={season} />;
}

// ---- Route: a wooden gateway between each pair of destinations, with the next destination named on its sign ----
// A wooden signpost on the left edge of the path, naming the next destination. It sits clear of the gates.
function Signpost({ z, nextName }) {
  return <group position={[-9.6, 0, z]}>
    <mesh position={[0, 1.6, 0]} castShadow><cylinderGeometry args={[0.18, 0.22, 3.2, 8]} /><meshStandardMaterial color="#6b3e22" /></mesh>
    <mesh position={[0, 3.3, 0.1]} castShadow><boxGeometry args={[5.4, 1.3, 0.18]} /><meshStandardMaterial color="#f5e6cf" /></mesh>
    <Text position={[0, 3.3, 0.24]} fontSize={0.52} maxWidth={5.1} color="#3b2418" anchorX="center" anchorY="middle">{`Next: ${nextName}`}</Text>
  </group>;
}

export function RouteLandmarks() {
  return <group>
    {DESTINATIONS.slice(1).map((destination, index) => (
      <Signpost key={destination.name} z={-(index * ROUTE_SEG + ROUTE_SEG / 2)} nextName={destination.name} />
    ))}
  </group>;
}
