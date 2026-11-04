import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { CHAMBERS } from './ingredients.js';

const BASE_COLOR = { milk: '#8a5a3a', dark: '#3b1f14', white: '#ead9bf', creamy: '#6b4330' };
const SWEET_LIFT = { light: 0, balanced: 0.02, extra: 0.04 };
const CREAM = '#f7f1e8';
const CHOCOLATE = '#3b2418';

// Liquid colour: base colour, pulled toward the flavour tint, then lifted a little for sweetness.
export function liquidColor(choices) {
  const base = new THREE.Color(BASE_COLOR[choices.base] ?? '#8a5a3a');
  const flavour = CHAMBERS[1].options.find((option) => option.id === choices.flavour);
  if (flavour?.tint) base.lerp(new THREE.Color(flavour.tint), 0.22);
  base.lerp(new THREE.Color('#ffffff'), SWEET_LIFT[choices.sweetness] ?? 0);
  return base;
}

function Steam() {
  const puffs = useRef([]);
  const offsets = useMemo(() => [0, 0.2, 0.4, 0.6, 0.8], []);
  useFrame((state) => {
    puffs.current.forEach((puff, index) => {
      if (!puff) return;
      const t = (state.clock.elapsedTime * 0.35 + offsets[index]) % 1;
      puff.position.y = 1.7 + t * 1.6;
      puff.position.x = Math.sin(t * 6 + index) * 0.12;
      puff.scale.setScalar(0.3 + t * 0.6);
      puff.material.opacity = (1 - t) * 0.28;
    });
  });
  return offsets.map((_, index) => (
    <mesh key={index} ref={(el) => { puffs.current[index] = el; }}>
      <sphereGeometry args={[0.2, 12, 10]} />
      <meshStandardMaterial color="#fff8ef" transparent opacity={0.3} depthWrite={false} />
    </mesh>
  ));
}

function Toppings({ toppings }) {
  // Each topping has a fixed place, so the cup looks the same every time the same options are picked.
  return <group>
    {toppings.includes('marshmallows') && [[-0.3, 0], [0.18, 0.12], [0.02, -0.25]].map(([x, z], index) => (
      <mesh key={`m${index}`} position={[x, 1.62 + (index % 2) * 0.08, z]} castShadow>
        <sphereGeometry args={[0.2, 14, 12]} />
        <meshStandardMaterial color="#fffdf7" roughness={0.9} />
      </mesh>
    ))}
    {toppings.includes('cream') && <mesh position={[0, 1.6, 0]} scale={[1, 0.6, 1]} castShadow>
      <sphereGeometry args={[0.5, 24, 16]} />
      <meshStandardMaterial color={CREAM} roughness={0.7} />
    </mesh>}
    {toppings.includes('chips') && [[-0.2, 1.5, 0.3], [0.25, 1.5, -0.1], [0.05, 1.5, 0.35], [-0.35, 1.5, -0.2]].map(([x, y, z], index) => (
      <mesh key={`c${index}`} position={[x, y, z]} rotation={[index, index * 0.7, 0.3]}>
        <boxGeometry args={[0.1, 0.1, 0.06]} />
        <meshStandardMaterial color={CHOCOLATE} roughness={0.5} />
      </mesh>
    ))}
    {toppings.includes('drizzle') && <mesh position={[0, 1.52, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.42, 0.04, 10, 40]} />
      <meshStandardMaterial color={CHOCOLATE} roughness={0.25} />
    </mesh>}
    {toppings.includes('cocoa') && <mesh position={[0, 1.53, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.7, 32]} />
      <meshStandardMaterial color="#4a2c1a" transparent opacity={0.55} roughness={1} />
    </mesh>}
  </group>;
}

function Mug({ choices }) {
  const liquid = useMemo(() => liquidColor(choices), [choices]);
  const flavour = CHAMBERS[1].options.find((option) => option.id === choices.flavour);
  const ring = flavour?.accent ?? '#c9a86a';
  return <group>
    <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.85, 0.7, 1.6, 40, 1, true]} />
      <meshStandardMaterial color="#f5ebdc" side={THREE.DoubleSide} roughness={0.35} />
    </mesh>
    <mesh position={[0, 0.02, 0]}>
      <cylinderGeometry args={[0.7, 0.7, 0.05, 40]} />
      <meshStandardMaterial color="#f5ebdc" />
    </mesh>
    {/* Band of flavour colour around the mug. */}
    <mesh position={[0, 0.35, 0]}>
      <torusGeometry args={[0.8, 0.05, 12, 60]} />
      <meshStandardMaterial color={ring} metalness={0.5} roughness={0.3} emissive={ring} emissiveIntensity={0.15} />
    </mesh>
    {/* The drink itself. */}
    <mesh position={[0, 1.45, 0]}>
      <cylinderGeometry args={[0.8, 0.8, 0.04, 40]} />
      <meshStandardMaterial color={liquid} roughness={0.12} metalness={0.05} />
    </mesh>
    <mesh position={[0.98, 0.8, 0]} rotation={[0, 0, 0]} castShadow>
      <torusGeometry args={[0.32, 0.09, 12, 24]} />
      <meshStandardMaterial color="#f5ebdc" roughness={0.35} />
    </mesh>
    <Toppings toppings={choices.toppings} />
    <Steam />
  </group>;
}

export default function CupModel({ choices }) {
  return <Canvas camera={{ position: [0, 2.2, 5.2], fov: 38 }} shadows dpr={[1, 1.5]}>
    <color attach="background" args={['#2b1a12']} />
    <hemisphereLight intensity={1.1} color="#fff1dc" groundColor="#5a3a22" />
    <directionalLight position={[3, 5, 4]} intensity={2.2} color="#ffe2b8" castShadow />
    <pointLight position={[-3, 2, 2]} intensity={1.2} color="#e0a050" />
    <group position={[0, -0.9, 0]}>
      <Mug choices={choices} />
      <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={5} blur={2.5} far={2} />
    </group>
    <OrbitControls enablePan={false} minDistance={3} maxDistance={8} autoRotate autoRotateSpeed={0.6} />
  </Canvas>;
}
