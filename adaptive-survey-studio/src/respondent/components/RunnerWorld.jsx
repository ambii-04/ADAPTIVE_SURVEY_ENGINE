import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, Text, ContactShadows } from '@react-three/drei';
import { Suspense, memo, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { DESTINATIONS, SEASON_THEMES, DestinationProps, RouteLandmarks, ROUTE_SEG, destinationFor } from './Destinations.jsx';

const getLanePositions = (count) => {
  if (count <= 1) return [0];
  // Lanes spread across the path so the larger doors have room between them.
  const first = -5.4;
  const last = 5.4;
  const spacing = (last - first) / (count - 1);
  return Array.from({ length: count }, (_, index) => first + spacing * index);
};
const PALETTE = ['#ffbd54', '#66dce5', '#d39bff', '#c9e77c'];
// Saturated gem colours for each door's emblem, so they read clearly against the warm scene.
const GEM_COLORS = ['#f5a524', '#22b8a8', '#a66cff', '#6cc24a'];
// Each door gets its own emblem shape, so answers stay distinct even without colour.
const EMBLEMS = [
  <torusGeometry args={[.36, .13, 12, 28]} />,
  <octahedronGeometry args={[.46]} />,
  <dodecahedronGeometry args={[.42]} />,
  <icosahedronGeometry args={[.44]} />,
];

// One colour for the scene background and the fog, so the fade-through has no visible seam.
// The four destinations the runner moves through (see Destinations.jsx). Each one changes the sky, fog,
// ground and light, and the props, only while the fog hides the scene.
const ZONES = DESTINATIONS;
const SCENE_COLOR = ZONES[0].sky;
const tmpColor = new THREE.Color();
// Smaller particle counts and a lower pixel ratio on phones and weak devices.
const LOW_DETAIL = typeof window !== 'undefined'
  && (window.matchMedia('(max-width: 700px)').matches || (navigator.hardwareConcurrency ?? 8) <= 4);
const GATE_START = -25;
const GATE_READY = -6.5;
const APPROACH_SPEED = 3;
const FOG_NEAR = 18;
const FOG_FAR = 48;
const STAGE_WALK = 0.9;
const STAGE_WALK_REDUCED = 0.2;
const SWEEP_SPEED = 11;
const SWEEP_SPEED_REDUCED = 22;
const EXIT_Z = -11;
const HOME_Z = -0.5;
// Walking the route to the next destination: seconds for the full walk, and for reduced motion.
const TRAVEL_SECONDS = 3.2;
const TRAVEL_SECONDS_REDUCED = 1.0;

const usePrefersReducedMotion = () => {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const handleChange = () => setReduced(media.matches);
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);
  return reduced;
};

function SeasonalPine({ x, z, season, index }) {
  const theme = SEASON_THEMES[season] ?? SEASON_THEMES.Spring;
  return <group position={[x, 0, z]} scale={0.82 + (index % 3) * 0.1}>
    <mesh position={[0, 0.9, 0]} castShadow>
      <cylinderGeometry args={[0.08, 0.15, 1.8, 7]} />
      <meshStandardMaterial color="#6b4a33" />
    </mesh>
    {[0, 1, 2].map((tier) => (
      <mesh key={tier} position={[0, 1.55 + tier * 0.55, 0]} castShadow>
        <coneGeometry args={[0.88 - tier * 0.18, 1.45, 8]} />
        <meshStandardMaterial color={tier === 1 ? theme.foliage : theme.evergreen} flatShading />
      </mesh>
    ))}
    {[0, 1, 2, 3].map((ornament) => {
      const angle = ornament * Math.PI / 2 + index;
      const radius = ornament % 2 ? 0.47 : 0.63;
      const height = 1.4 + (ornament % 3) * 0.55;
      return <mesh key={ornament} position={[Math.cos(angle) * radius, height, Math.sin(angle) * radius]}>
        <sphereGeometry args={[0.085, 8, 8]} />
        <meshStandardMaterial color={theme.ornament} metalness={0.2} roughness={0.35} />
      </mesh>;
    })}
    <mesh position={[0, 3.05, 0]}>
      <octahedronGeometry args={[0.17]} />
      <meshStandardMaterial color="#ffe08a" emissive="#f5bd47" emissiveIntensity={0.45} />
    </mesh>
    {season === 'Winter' && [0, 1, 2].map((tier) => (
      <mesh key={`snow-${tier}`} position={[0, 2.05 + tier * 0.55, 0.05]}>
        <coneGeometry args={[0.56 - tier * 0.12, 0.16, 8]} />
        <meshStandardMaterial color="#f5f7f3" roughness={0.8} />
      </mesh>
    ))}
  </group>;
}

function SeasonWeather({ season, isPaused }) {
  const rain = useRef();
  useFrame((_, dt) => {
    if (season !== 'Monsoon' || isPaused || !rain.current) return;
    rain.current.children.forEach((drop, index) => {
      drop.position.y -= dt * (8 + (index % 4));
      if (drop.position.y < 0.2) {
        drop.position.y = 6 + (index % 7) * 0.5;
      }
    });
  });

  if (season === 'Monsoon') {
    return <group ref={rain} position={[0, 0, -9]}>
      {Array.from({ length: 48 }, (_, index) => (
        <mesh
          key={index}
          position={[
            ((index * 37) % 150) / 10 - 7.5,
            1 + ((index * 19) % 55) / 10,
            -((index * 13) % 30),
          ]}
          rotation={[0.12, 0, 0.08]}
        >
          <boxGeometry args={[0.018, 0.32, 0.018]} />
          <meshBasicMaterial color="#d8e9f0" transparent opacity={0.58} />
        </mesh>
      ))}
    </group>;
  }
  if (season === 'Winter') {
    return <Sparkles count={LOW_DETAIL ? 32 : 76} scale={[15, 7, 40]} size={3.8} speed={0.22} opacity={0.72} color="#f5fbff" position={[0, 3, -12]} />;
  }
  if (season === 'Spring') {
    return <Sparkles count={LOW_DETAIL ? 20 : 48} scale={[15, 5, 35]} size={3.2} speed={0.3} opacity={0.65} color="#f0a8bd" position={[0, 2.5, -12]} />;
  }
  return <Sparkles count={LOW_DETAIL ? 14 : 32} scale={[15, 4, 35]} size={3.2} speed={0.18} opacity={0.45} color="#ffd47a" position={[0, 3, -12]} />;
}

function Ground({ isPaused, mats, season }) {
  const stripes = useRef();
  useFrame((_, dt) => {
    if (!isPaused && stripes.current) {
      stripes.current.position.z = (stripes.current.position.z + dt * 9) % 5;
    }
  });
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, -150]} receiveShadow><planeGeometry args={[18, 380]} /><meshStandardMaterial ref={(m) => { mats.ground = m; }} color={ZONES[0].ground} roughness={0.92} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, -150]}><planeGeometry args={[13, 380]} /><meshStandardMaterial ref={(m) => { mats.path = m; }} color={ZONES[0].path} roughness={0.94} /></mesh>
    <group ref={stripes}>{Array.from({ length: 68 }, (_, i) => <group key={i} position={[0, -0.04, -i * 5]}>{[-2.15, 2.15].map((x) => <mesh key={x} position={[x, 0, 0]}><boxGeometry args={[0.12, 0.03, 2.8]} /><meshStandardMaterial color="#fff0c2" emissive="#c9a866" emissiveIntensity={0.12} /></mesh>)}</group>)}</group>
    {[-1, 1].map((side) => <mesh key={side} position={[side * 6.35, -0.015, -150]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.18, 380]} /><meshStandardMaterial color="#d79d51" emissive="#ad7137" emissiveIntensity={0.18} /></mesh>)}
    {[-1, 1].map((side) => (
      <group key={side} position={[side * 8.3, 0, -8]}>
        {Array.from({ length: 10 }, (_, index) => (
          <SeasonalPine
            key={index}
            x={side * (index % 2) * 0.5}
            z={-index * 6}
            season={season}
            index={index}
          />
        ))}
      </group>
    ))}
    <fog attach="fog" args={[SCENE_COLOR, FOG_NEAR, FOG_FAR]} />
  </group>;
}

function Gate({ option, index, positionX, active, onChoose, gateWidth, gateScale, reducedMotion, celebrate }) {
  const hingeL = useRef(); const hingeR = useRef(); const emblem = useRef(); const hovered = useRef(false); const pop = useRef(0);
  const x = positionX; const color = PALETTE[index % PALETTE.length]; const gem = GEM_COLORS[index % GEM_COLORS.length];
  const halfWidth = gateWidth / 2;
  const doorWidth = gateWidth * 0.39;
  useFrame((_, dt) => {
    const rate = reducedMotion ? 14 : 5;
    const target = active ? -1.24 : 0;
    if (hingeL.current) hingeL.current.rotation.y = THREE.MathUtils.damp(hingeL.current.rotation.y, target, rate, dt);
    if (hingeR.current) hingeR.current.rotation.y = THREE.MathUtils.damp(hingeR.current.rotation.y, active ? 1.24 : 0, rate, dt);
    if (emblem.current) {
      if (celebrate) pop.current += dt; else pop.current = 0;
      if (!reducedMotion) emblem.current.rotation.y += dt * (celebrate ? 10 : active ? 2.2 : 0.6);
      // A quick overshoot-and-settle when the runner passes through: the gem "pops".
      const burst = celebrate && !reducedMotion ? Math.max(0, Math.sin(pop.current * 8)) * Math.exp(-pop.current * 3) * 1.1 : 0;
      const target = (hovered.current || active ? 1.18 : 1) + burst;
      emblem.current.scale.setScalar(THREE.MathUtils.damp(emblem.current.scale.x, target, celebrate ? 25 : 8, dt));
    }
  });
  return <group
    position={[x, 0, 0]}
    scale={gateScale}
    onClick={(e) => { e.stopPropagation(); onChoose(option, index); }}
    onPointerOver={(e) => { e.stopPropagation(); hovered.current = true; document.body.style.cursor = 'pointer'; }}
    onPointerOut={() => { hovered.current = false; document.body.style.cursor = 'default'; }}
  >
    <mesh position={[0, 2.1, 0]} castShadow><boxGeometry args={[gateWidth, .18, .35]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={.65} /></mesh>
    {[-1, 1].map(s => <mesh key={s} position={[s * (halfWidth - 0.09), 1.08, 0]} castShadow><boxGeometry args={[.18, 2.16, .32]} /><meshStandardMaterial color={color} metalness={.3} roughness={.25} emissive={color} emissiveIntensity={.35} /></mesh>)}
    <group ref={hingeL} position={[-doorWidth, .06, .04]}><mesh position={[doorWidth / 2, 1, 0]} castShadow><boxGeometry args={[doorWidth, 1.9, .12]} /><meshStandardMaterial color="#8b5a3c" roughness={.5} /></mesh><mesh position={[doorWidth / 2, 1, .071]}><boxGeometry args={[doorWidth * .76, 1.6, .025]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={.35} /></mesh><mesh position={[doorWidth * .8, 1, .1]}><sphereGeometry args={[.07, 12, 12]} /><meshStandardMaterial color="#fff5cc" metalness={.8} emissive={color} emissiveIntensity={.2} /></mesh></group>
    <group ref={hingeR} position={[doorWidth, .06, .04]}><mesh position={[-doorWidth / 2, 1, 0]} castShadow><boxGeometry args={[doorWidth, 1.9, .12]} /><meshStandardMaterial color="#8b5a3c" roughness={.5} /></mesh><mesh position={[-doorWidth / 2, 1, .071]}><boxGeometry args={[doorWidth * .76, 1.6, .025]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={.35} /></mesh><mesh position={[-doorWidth * .8, 1, .1]}><sphereGeometry args={[.07, 12, 12]} /><meshStandardMaterial color="#fff5cc" metalness={.8} emissive={color} emissiveIntensity={.2} /></mesh></group>
    <mesh position={[0, 2.72, .13]}><boxGeometry args={[gateWidth + .12, 1.28, .2]} /><meshStandardMaterial color="#3d2940" emissive={color} emissiveIntensity={.18} /></mesh>
    <mesh position={[0, 2.72, .235]}><boxGeometry args={[gateWidth - .06, 1.12, .04]} /><meshStandardMaterial color="#4a3650" /></mesh>
    <mesh ref={emblem} position={[0, 1.08, 0.1]} castShadow>{EMBLEMS[index % EMBLEMS.length]}<meshStandardMaterial color={gem} emissive={gem} emissiveIntensity={celebrate ? 1.4 : active ? .45 : .12} roughness={.15} metalness={.2} flatShading /></mesh>
    {celebrate && <Sparkles count={36} scale={[2.4, 2.6, 1.4]} position={[0, 1.4, .3]} size={9} speed={2.2} opacity={1} color={gem} noise={.6} />}
    <Text position={[0, 2.74, .3]} fontSize={gateWidth > 2 ? .4 : .31} maxWidth={gateWidth - .25} lineHeight={1.1} textAlign="center" color="#ffffff" anchorX="center" anchorY="middle" outlineWidth={.03} outlineColor="#1a0f1f">{option.label}</Text>
    <Text position={[0, 3.44, .24]} fontSize={.25} color={color} anchorX="center" anchorY="middle" outlineWidth={.025} outlineColor="#1a0f1f">{`OPTION ${index + 1}`}</Text>
    {/* A glowing ring on the path marks each door's lane, brighter when it is chosen. */}
    <mesh position={[0, 0.03, 0.3]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[gateWidth * 0.5, gateWidth * 0.62, 40]} /><meshStandardMaterial color={gem} emissive={gem} emissiveIntensity={active ? 1.3 : 0.35} transparent opacity={0.9} /></mesh>
    <pointLight position={[0, 2.3, 1.2]} color={color} intensity={active ? 4.5 : 2.2} distance={6.5} decay={1.5} />
  </group>;
}

// A five-point star, extruded once and shared, used as the collectible for each saved answer.
const starGeometry = (() => {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 ? 0.09 : 0.2;
    const angle = Math.PI / 2 + (i * Math.PI) / 5;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: false });
})();

// The runner's position is driven by the scene's shared `rig` ref, so motion never waits on React re-renders.
function Player({ rig, isPaused, characterId }) {
  const root = useRef(); const leftLeg = useRef(); const rightLeg = useRef(); const leftArm = useRef(); const rightArm = useRef(); const star = useRef();
  useFrame((state) => {
    if (!root.current) return;
    const { x, z, stage, reduced, timer, collect } = rig.current;
    root.current.position.x = x;
    root.current.position.z = z;
    if (star.current) {
      // Rises from the runner, spins, then pops out over about 1.4 seconds.
      star.current.visible = collect >= 0;
      if (collect >= 0) {
        const pop = Math.min(1, collect * 4) * Math.max(0, 1 - Math.max(0, collect - 1) * 2.5);
        star.current.position.y = 2.0 + collect * 1.1;
        star.current.rotation.y = collect * 5;
        // The star takes the light colour of the destination the runner is in.
        star.current.material.emissive.set(DESTINATIONS[Math.min(DESTINATIONS.length - 1, Math.max(0, Math.round(rig.current.world / ROUTE_SEG)))].light);
        star.current.scale.setScalar(pop);
      }
    }
    if (isPaused) return;
    // The runner is always running: a steady stride on the approach, and a faster, bigger stride through a door.
    const t = state.clock.elapsedTime;
    const cadence = stage === 2 ? 16 : 12;
    const phase = t * cadence;
    const bob = reduced ? .03 : stage === 2 ? .2 : .12;
    const swingAmount = reduced ? .45 : stage === 2 ? 1.5 : 1.1;
    // Passing through a door: a small hop and both arms up as the answer is confirmed.
    const cheer = stage === 3 && !reduced ? Math.min(1, timer * 5) : 0;
    const hop = stage === 3 && !reduced ? Math.abs(Math.sin(timer * 8)) * .3 * Math.exp(-timer * 1.6) : 0;
    // Going through a door, the runner hurdles up and over the threshold in a short arc.
    const hurdle = stage === 2 && !reduced ? Math.sin(Math.min(timer / 0.45, 1) * Math.PI) * 0.7 : 0;
    root.current.position.y = .08 + Math.abs(Math.sin(phase)) * bob + hop + hurdle;
    // A forward lean and a slight sway make the stride read as running, not marching in place.
    // A failed save walks the runner back with a short, fading stumble.
    const stumble = stage === 5 && !reduced ? Math.sin(timer * 9) * 0.14 * Math.exp(-timer * 1.4) : 0;
    if (!reduced) {
      root.current.rotation.x = stage === 2 ? -0.16 : -0.08;
      root.current.rotation.z = Math.sin(phase * 0.5) * 0.04 + stumble;
    }
    const swing = Math.sin(phase) * swingAmount * (1 - cheer);
    if (leftLeg.current) leftLeg.current.rotation.x = swing;
    if (rightLeg.current) rightLeg.current.rotation.x = -swing;
    if (leftArm.current) leftArm.current.rotation.x = cheer ? -2.8 * cheer : -swing * 1.1;
    if (rightArm.current) rightArm.current.rotation.x = cheer ? -2.8 * cheer : swing * 1.1;
  });
  const bodyColor = characterId === 'girl' ? '#FF6B9D' : '#6366F1';
  const pantsColor = '#1F2937';
  const skinColor = '#FDBCB4';
  return <group ref={root} position={[0, 0, 0]} scale={1.25}>
    <mesh position={[0, 0.65, 0]} castShadow><capsuleGeometry args={[.22, .42, 4, 8]} /><meshStandardMaterial color={bodyColor} roughness={.6} /></mesh>
    <mesh position={[0, 1.15, 0]} castShadow><sphereGeometry args={[.2, 16, 12]} /><meshStandardMaterial color={skinColor} roughness={.75} /></mesh>
    <mesh position={[0, 1.27, -.01]} castShadow><sphereGeometry args={[.22, 14, 8, 0, Math.PI * 2, 0, Math.PI * .5]} /><meshStandardMaterial color="#2C2C2C" roughness={.85} /></mesh>
    {characterId === 'girl' && <group><mesh position={[0, 1.16, -.13]} castShadow><sphereGeometry args={[.15, 12, 10]} /><meshStandardMaterial color="#8B6B7F" /></mesh><mesh position={[-.18, 0.92, 0]} castShadow><capsuleGeometry args={[.07, .3, 3, 6]} /><meshStandardMaterial color="#8B6B7F" /></mesh><mesh position={[.18, 0.92, 0]} castShadow><capsuleGeometry args={[.07, .3, 3, 6]} /><meshStandardMaterial color="#8B6B7F" /></mesh></group>}
    <mesh position={[0, 0.32, .03]}><boxGeometry args={[.34, .1, .23]} /><meshStandardMaterial color={pantsColor} /></mesh>
    <mesh position={[0, 1.05, -0.24]} castShadow><boxGeometry args={[.5, .45, .3]} /><meshStandardMaterial color={pantsColor} roughness={.65} /></mesh>
    <mesh position={[0, 0.95, -0.27]}><boxGeometry args={[.44, .35, .26]} /><meshStandardMaterial color="#374151" roughness={.45} /></mesh>
    <group ref={leftLeg} position={[-.11, .35, 0]}><mesh position={[0, -.16, 0]} castShadow><capsuleGeometry args={[.075, .3, 3, 6]} /><meshStandardMaterial color={pantsColor} roughness={.7} /></mesh><mesh position={[0, -.33, .065]}><boxGeometry args={[.15, .08, .24]} /><meshStandardMaterial color="#4B5563" roughness={.8} /></mesh></group>
    <group ref={rightLeg} position={[.11, .35, 0]}><mesh position={[0, -.16, 0]} castShadow><capsuleGeometry args={[.075, .3, 3, 6]} /><meshStandardMaterial color={pantsColor} roughness={.7} /></mesh><mesh position={[0, -.33, .065]}><boxGeometry args={[.15, .08, .24]} /><meshStandardMaterial color="#4B5563" roughness={.8} /></mesh></group>
    <group ref={leftArm} position={[-.25, .88, 0]}><mesh position={[-.02, -.16, 0]} rotation={[0, 0, -.15]}><capsuleGeometry args={[.06, .3, 3, 6]} /><meshStandardMaterial color={skinColor} roughness={.75} /></mesh></group>
    <group ref={rightArm} position={[.25, .88, 0]}><mesh position={[.02, -.16, 0]} rotation={[0, 0, .15]}><capsuleGeometry args={[.06, .3, 3, 6]} /><meshStandardMaterial color={skinColor} roughness={.75} /></mesh></group>
    <mesh position={[0, .03, -.05]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[.36, 24]} /><meshBasicMaterial color="#171022" transparent opacity={.32} /></mesh>
    <mesh ref={star} geometry={starGeometry} position={[0, 2.0, 0.2]} visible={false}>
      <meshStandardMaterial color="#ffd65e" emissive="#ffb835" emissiveIntensity={0.9} metalness={0.3} roughness={0.3} />
    </mesh>
    {/* Warm key light that travels with the runner, so the character stays readable against the scenery. */}
    <pointLight position={[0, 2.2, 1.1]} color="#ffdcaa" intensity={1.6} distance={5} decay={1.6} />
  </group>;
}

// Roadside lantern with a slow, gentle glow.
function Lantern({ x, z, phase, rig }) {
  const glow = useRef();
  useFrame((state) => {
    // The glow briefly brightens when the runner succeeds or arrives (rig.pulse).
    if (glow.current) glow.current.emissiveIntensity = .55 + Math.sin(state.clock.elapsedTime * 1.4 + phase) * .15 + rig.current.pulse * 1.2;
  });
  return <group position={[x, .5, z]}>
    <mesh position={[0, 1.2, 0]} castShadow><cylinderGeometry args={[0.12, 0.2, 2, 6]} /><meshStandardMaterial color="#7a5c44" roughness={.7} /></mesh>
    <mesh position={[0, 2.6, 0]} castShadow><sphereGeometry args={[0.7, 14, 14]} /><meshStandardMaterial ref={glow} color="#ffd08a" emissive="#ffb35c" emissiveIntensity={.55} roughness={.6} /></mesh>
  </group>;
}

function RunnerScene({ options, selected, multiSelect, isPaused, onChoose, onRunComplete, onSceneReady, sceneKey, characterId, season, reducedMotion, saveState, zoneIndex }) {
  // Stages: 0 approach, 1 walk up to the door (waits for the save), 2 run through, 3 gates sweep past,
  // 4 fade-hold until the next question, 5 walk back after a failed save.
  // world: how far along the route the runner is (the world moves past them). travelFrom/To/T drive the walk.
  // collect: seconds since the star collectible appeared (-1 when hidden). pulse: 0..1 lantern glow.
  const rig = useRef({ x: 0, z: HOME_Z, zTarget: HOME_Z, laneX: 0, stage: 0, timer: 0, fade: 0, fadeTarget: 0, reduced: reducedMotion, world: 0, travelFrom: 0, travelTo: 0, travelT: 0, collect: -1, pulse: 0 });
  const gateZ = useRef(GATE_START); const gateGroup = useRef(); const fxGroup = useRef();
  const pendingReset = useRef(true); const runReported = useRef(false);
  // The location only changes during a reset, so the colour change is hidden by the fog.
  const targetZone = useRef(destinationFor(zoneIndex)); const groundMats = useRef({ ground: null, path: null });
  const hemiRef = useRef(); const keyRef = useRef(); const worldRef = useRef();
  const cameraTarget = useRef(new THREE.Vector3(0, 1.5, -8));
  const lanePositions = useMemo(() => getLanePositions(options.length), [options.length]);
  const centerLane = lanePositions[Math.floor((lanePositions.length - 1) / 2)] ?? 0;
  const gateWidth = options.length > 4 ? 1.78 : 2.6;
  // Doors are scaled up for readable labels; the factor stays small enough that neighbouring doors don't touch.
  const gateScale = options.length > 4 ? 1.4 : 1.3;
  const selectedOptions = Array.isArray(selected) ? selected : selected ? [selected] : [];
  // The runner heads for the most recently picked door. For multiple choice that is the last item in the list.
  // Before the fix, multiple-choice questions always returned -1 here, so the runner ignored the picks and walked to the centre.
  const lastPick = Array.isArray(selected) ? selected[selected.length - 1] : selected;
  const selectedIndex = lastPick ? options.findIndex((option) => option.id === lastPick.id) : -1;
  const runActive = saveState === 'saving' || saveState === 'saved';
  // Set once the runner is through the door; the chosen gem uses it to pop.
  const [passed, setPassed] = useState(false);

  useEffect(() => { rig.current.reduced = reducedMotion; }, [reducedMotion]);
  // A new question marks the world for reset; the reset itself waits until the fog has hidden it.
  useEffect(() => { pendingReset.current = true; }, [sceneKey]);

  useFrame((state, dt) => {
    if (isPaused) return;
    const r = rig.current;
    const reduced = r.reduced;

    r.fade = THREE.MathUtils.damp(r.fade, r.fadeTarget, reduced ? 14 : 5, dt);
    if (state.scene.fog) {
      state.scene.fog.near = THREE.MathUtils.lerp(FOG_NEAR, 0, r.fade);
      state.scene.fog.far = THREE.MathUtils.lerp(FOG_FAR, 0.01, r.fade);
    }
    // Hide the sparkles and floating orbs too, since they don't take fog.
    if (fxGroup.current) fxGroup.current.visible = r.fade < 0.6;

    // Ease the sky, fog and ground toward the current location. The fog and sky share one colour, so the seam stays hidden.
    const zone = {
      ...ZONES[targetZone.current % ZONES.length],
      ...(SEASON_THEMES[season] ?? SEASON_THEMES.Spring),
    };
    const k = 1 - Math.exp(-dt * 0.9);
    if (state.scene.background?.isColor) state.scene.background.lerp(tmpColor.set(zone.sky), k);
    if (state.scene.fog) state.scene.fog.color.lerp(tmpColor.set(zone.sky), k);
    if (groundMats.current.ground) groundMats.current.ground.color.lerp(tmpColor.set(zone.ground), k);
    if (groundMats.current.path) groundMats.current.path.color.lerp(tmpColor.set(zone.path), k);
    if (hemiRef.current) hemiRef.current.color.lerp(tmpColor.set(zone.hemi), k);
    if (keyRef.current) keyRef.current.color.lerp(tmpColor.set(zone.light), k);

    if (pendingReset.current && (r.fade > 0.96 || r.fade < 0.02)) {
      gateZ.current = GATE_START;
      runReported.current = false;
      r.stage = 0; r.timer = 0; r.fadeTarget = 0; r.collect = -1;
      setPassed(false);
      // The character keeps its lane and position between questions; only the world changes.
      r.x = r.laneX; r.z = HOME_Z; r.zTarget = HOME_Z;
      // The world position (r.world) is left alone: the runner stays where the last walk ended.
      targetZone.current = destinationFor(zoneIndex);
      pendingReset.current = false;
      onSceneReady?.();
    }

    r.zTarget = HOME_Z;
    if (r.stage === 0 && runActive) {
      r.stage = 1; r.timer = 0;
      r.laneX = selectedIndex >= 0 ? lanePositions[selectedIndex] : centerLane;
    }
    if (r.stage === 1) {
      if (!runActive) {
        r.stage = 5; r.timer = 0;
      } else {
        r.timer += dt;
        gateZ.current = THREE.MathUtils.damp(gateZ.current, GATE_READY, 6, dt);
        r.zTarget = gateZ.current + 0.95;
        // The runner waits at the door until the answer is confirmed saved.
        // Saved: the star collectible appears as the runner steps into the door.
        if (r.timer > (reduced ? STAGE_WALK_REDUCED : STAGE_WALK) && saveState === 'saved') { r.stage = 2; r.timer = 0; r.collect = 0; }
      }
    }
    if (r.stage === 2) {
      r.timer += dt;
      r.zTarget = EXIT_Z;
      if (r.z < gateZ.current - 1.6) { r.stage = 3; r.timer = 0; r.pulse = Math.max(r.pulse, 0.5); setPassed(true); }
    }
    if (r.stage === 3) {
      r.zTarget = EXIT_Z;
      r.timer += dt;
      gateZ.current += dt * (reduced ? SWEEP_SPEED_REDUCED : SWEEP_SPEED);
      if (gateZ.current > 10) {
        const target = destinationFor(zoneIndex) * ROUTE_SEG;
        if (Math.abs(target - r.world) > 1) {
          // A new destination: walk the route to it. The next question appears on arrival.
          r.stage = 6; r.travelFrom = r.world; r.travelTo = target; r.travelT = 0;
        } else {
          r.stage = 4;
          r.fadeTarget = 1;
          if (!runReported.current) { runReported.current = true; onRunComplete?.(); }
        }
      }
    }
    if (r.stage === 6) {
      // Walking: the runner stays on screen while the world slides past, with the colours easing along the route.
      r.zTarget = HOME_Z;
      r.travelT = Math.min(1, r.travelT + dt / (reduced ? TRAVEL_SECONDS_REDUCED : TRAVEL_SECONDS));
      const eased = r.travelT * r.travelT * (3 - 2 * r.travelT);
      r.world = r.travelFrom + (r.travelTo - r.travelFrom) * eased;
      targetZone.current = Math.round(r.world / ROUTE_SEG);
      if (r.travelT >= 1) {
        r.world = r.travelTo;
        r.stage = 8;
        r.pulse = 1; // arrival: the lanterns glow to mark the new destination
      }
    }
    if (r.stage === 8) {
      // Arrived: stop here and release the next question.
      r.zTarget = HOME_Z;
      if (!runReported.current) { runReported.current = true; onRunComplete?.(); }
    }
    if (r.stage === 5) {
      r.timer += dt;
      // Failed save: walk back to the start smoothly, the gates stay where they are.
      r.zTarget = HOME_Z;
      r.laneX = centerLane;
      if (Math.abs(r.z - HOME_Z) < 0.05 && Math.abs(r.x - centerLane) < 0.05) r.stage = 0;
    }

    // Reactions decay on their own timers, independent of the stage, so they never overlap or reset abruptly.
    if (r.collect >= 0) { r.collect += dt; if (r.collect > 1.4) r.collect = -1; }
    r.pulse = Math.max(0, r.pulse - dt * 0.4);

    r.z = THREE.MathUtils.damp(r.z, r.zTarget, r.stage === 2 ? 2.2 : 2.6, dt);
    r.x = THREE.MathUtils.damp(r.x, r.laneX, reduced ? 12 : 5, dt);
    if (gateGroup.current) gateGroup.current.position.z = gateZ.current;
    if (worldRef.current) worldRef.current.position.z = r.world;

    // The camera drifts toward the lane while running, and stays still for reduced motion.
    const camX = r.stage >= 1 && r.stage <= 3 && !reduced ? r.laneX * .55 : 0;
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, camX, 2.8, dt);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, 4.3, 2, dt);
    state.camera.position.z = 7.5;
    state.camera.lookAt(cameraTarget.current.set(state.camera.position.x * .35, 1.3, -8.8));
  });

  return <>
    <color attach="background" args={[SCENE_COLOR]} />
    <hemisphereLight ref={hemiRef} intensity={1.6} color="#fff1dc" groundColor="#a88a62" />
    <directionalLight ref={keyRef} position={[-5, 11, 5]} intensity={2.5} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} color="#ffeacc" />
    <directionalLight position={[6, 6, -14]} intensity={1.4} color="#f5d5b8" />
    <pointLight position={[0, 3, -8]} color="#ffd9a8" intensity={1.2} distance={20} />
    {/* Everything on the route moves together as the runner walks. */}
    <group ref={worldRef}>
      <Ground isPaused={isPaused} mats={groundMats.current} season={season} />
      {DESTINATIONS.map((_, index) => <group key={index} position={[0, 0, -index * ROUTE_SEG]}><DestinationProps index={index} season={season} /></group>)}
      <RouteLandmarks />
      {[-8, 8].map(side => <group key={side}>{Array.from({ length: 21 }, (_, i) => <Lantern key={i} x={side * 7} z={-i * 16} phase={i + (side > 0 ? 1.7 : 0)} rig={rig} />)}</group>)}
      <SeasonWeather season={season} isPaused={isPaused} />
    </group>
    <group ref={gateGroup} position={[0, 0, GATE_START]}>{options.map((option, i) => <Gate key={i} option={option} index={i} positionX={lanePositions[i]} active={selectedOptions.some((item) => item.id === option.id)} gateWidth={gateWidth} gateScale={gateScale} reducedMotion={reducedMotion} celebrate={passed && selectedOptions.some((item) => item.id === option.id)} onChoose={(opt, idx) => {
      if (isPaused) return;
      if (multiSelect) { onChoose(opt); return; }
      // Only one door can be chosen, and only while the runner is still on the approach.
      if (!selected && rig.current.stage === 0) onChoose(opt, idx);
    }} />)}</group>
    <Player rig={rig} isPaused={isPaused} characterId={characterId} />
    <group ref={fxGroup}>
      <Sparkles count={LOW_DETAIL ? 50 : 120} scale={[15, 8, 40]} size={2.8} speed={.25} opacity={.6} color="#f5ede0" position={[0, 3, -11]} />
      {/* Warm drifting dust catches the light and adds depth. */}
      <Sparkles count={LOW_DETAIL ? 20 : 45} scale={[16, 6, 40]} size={3} speed={.15} opacity={.5} color="#ffe2b0" position={[0, 2.5, -10]} />
      <Float speed={1.2} rotationIntensity={.1} floatIntensity={.15}><mesh position={[-7, 4.5, -18]}><sphereGeometry args={[.85, 20, 20]} /><meshStandardMaterial color="#fff5e0" emissive="#f5e6d3" emissiveIntensity={.5} /></mesh></Float>
      <Float speed={0.9} rotationIntensity={.08} floatIntensity={.12}><mesh position={[7, 3.8, -20]}><sphereGeometry args={[.6, 16, 16]} /><meshStandardMaterial color="#ffeacc" emissive="#f5d5b8" emissiveIntensity={.4} /></mesh></Float>
    </group>
    <ContactShadows position={[0, -.11, 0]} opacity={.35} scale={9} blur={3} far={5} />
  </>;
}

// Memoized: the parent re-renders every second for the timer, and the scene should not rebuild for that.
const RunnerWorld = memo(function RunnerWorld({ options, selected, multiSelect = false, isPaused = false, onChoose, onRunComplete, onSceneReady, sceneKey, characterId, season = 'Spring', saveState = 'idle', zoneIndex = 0 }) {
  const reducedMotion = usePrefersReducedMotion();
  return <div className="runner-world"><Canvas shadows={!LOW_DETAIL} dpr={LOW_DETAIL ? [1, 1] : [1, 1.5]} camera={{ position: [0, 4.3, 7.5], fov: 52 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
    <Suspense fallback={null}><RunnerScene options={options} selected={selected} multiSelect={multiSelect} isPaused={isPaused} onChoose={onChoose} onRunComplete={onRunComplete} onSceneReady={onSceneReady} sceneKey={sceneKey} characterId={characterId} season={season} reducedMotion={reducedMotion} saveState={saveState} zoneIndex={zoneIndex} /></Suspense>
  </Canvas></div>;
});

export default RunnerWorld;
