import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function MeshPart({
  geometry,
  material,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
}: {
  geometry: JSX.Element;
  material: JSX.Element;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation} scale={scale} castShadow receiveShadow>
      {geometry}
      {material}
    </mesh>
  );
}

export function PlayerShooterModel({
  moving = true,
  active = true,
}: {
  moving?: boolean;
  active?: boolean;
}) {
  const root = useRef<THREE.Group>(null!);
  const armL = useRef<THREE.Group>(null!);
  const armR = useRef<THREE.Group>(null!);
  const legL = useRef<THREE.Group>(null!);
  const legR = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const swing = moving && active ? Math.sin(t * 8) * 0.35 : 0;
    const bob = moving && active ? Math.abs(Math.sin(t * 8)) * 0.08 : 0;

    root.current.position.y = bob;
    armL.current.rotation.x = swing;
    armR.current.rotation.x = -swing * 0.65;
    legL.current.rotation.x = -swing * 0.9;
    legR.current.rotation.x = swing * 0.9;
  });

  return (
    <group ref={root} className="player-model">
      <MeshPart
        geometry={<capsuleGeometry args={[0.44, 0.95, 8, 16]} />}
        material={
          <meshStandardMaterial
            color={active ? "#40c4ff" : "#64748b"}
            roughness={0.45}
            metalness={0.35}
            emissive={active ? "#0a5c8b" : "#000000"}
            emissiveIntensity={0.6}
          />
        }
        position={[0, 1.1, 0]}
        scale={[1, 1.12, 0.82]}
      />

      <MeshPart
        geometry={<sphereGeometry args={[0.4, 18, 18]} />}
        material={<meshStandardMaterial color="#d9f4ff" roughness={0.28} metalness={0.15} />}
        position={[0, 2.12, 0.04]}
        scale={[1.05, 1.05, 0.95]}
      />

      <MeshPart
        geometry={<boxGeometry args={[0.72, 0.24, 0.24]} />}
        material={<meshStandardMaterial color="#0f172a" metalness={0.55} roughness={0.35} />}
        position={[0, 2.08, 0.36]}
      />

      <group ref={armL} position={[-0.52, 1.75, 0]}>
        <MeshPart
          geometry={<cylinderGeometry args={[0.08, 0.1, 0.95, 10]} />}
          material={<meshStandardMaterial color="#9edfff" roughness={0.38} metalness={0.25} />}
          position={[0, -0.38, 0]}
        />
      </group>

      <group ref={armR} position={[0.55, 1.72, 0.04]}>
        <MeshPart
          geometry={<cylinderGeometry args={[0.08, 0.1, 0.95, 10]} />}
          material={<meshStandardMaterial color="#9edfff" roughness={0.38} metalness={0.25} />}
          position={[0, -0.38, 0]}
        />

        <MeshPart
          geometry={<boxGeometry args={[0.28, 0.22, 1.2]} />}
          material={
            <meshStandardMaterial
              color="#1e293b"
              metalness={0.8}
              roughness={0.25}
              emissive="#22d3ee"
              emissiveIntensity={0.35}
            />
          }
          position={[0, -0.52, 0.76]}
        />
      </group>

      <group ref={legL} position={[-0.2, 0.68, 0]}>
        <MeshPart
          geometry={<cylinderGeometry args={[0.1, 0.13, 1.1, 10]} />}
          material={<meshStandardMaterial color="#7dd3fc" roughness={0.4} metalness={0.22} />}
          position={[0, -0.48, 0]}
        />
      </group>

      <group ref={legR} position={[0.2, 0.68, 0]}>
        <MeshPart
          geometry={<cylinderGeometry args={[0.1, 0.13, 1.1, 10]} />}
          material={<meshStandardMaterial color="#7dd3fc" roughness={0.4} metalness={0.22} />}
          position={[0, -0.48, 0]}
        />
      </group>
    </group>
  );
}

export function FrogEnemyModel({
  scale = 1,
  hit = false,
  moving = true,
}: {
  scale?: number;
  hit?: boolean;
  moving?: boolean;
}) {
  const root = useRef<THREE.Group>(null!);
  const frontL = useRef<THREE.Group>(null!);
  const frontR = useRef<THREE.Group>(null!);
  const backL = useRef<THREE.Group>(null!);
  const backR = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const swing = moving ? Math.sin(t * 9) : 0;
    const bounce = moving ? Math.abs(Math.sin(t * 9)) * 0.08 : 0;

    root.current.position.y = bounce;
    frontL.current.rotation.x = swing * 0.45;
    frontR.current.rotation.x = -swing * 0.45;
    backL.current.rotation.x = -swing * 0.8;
    backR.current.rotation.x = swing * 0.8;
  });

  const bodyColor = hit ? "#d8ff8a" : "#59b84e";
  const bellyColor = hit ? "#f3ffd3" : "#bdd88c";

  return (
    <group ref={root} scale={scale} className="frog-model">
      <MeshPart
        geometry={<sphereGeometry args={[1.15, 26, 26]} />}
        material={<meshStandardMaterial color={bodyColor} roughness={0.92} />}
        position={[0, 0.98, 0]}
        scale={[1.45, 0.82, 1.95]}
      />

      <MeshPart
        geometry={<sphereGeometry args={[0.95, 24, 24]} />}
        material={<meshStandardMaterial color={bodyColor} roughness={0.92} />}
        position={[0, 1.2, 1.3]}
        scale={[1.28, 0.72, 1.02]}
      />

      <MeshPart
        geometry={<sphereGeometry args={[0.7, 18, 18]} />}
        material={<meshStandardMaterial color={bellyColor} roughness={0.96} />}
        position={[0, 0.9, 0.7]}
        scale={[1.35, 0.55, 0.8]}
      />

      <MeshPart
        geometry={<sphereGeometry args={[0.26, 16, 16]} />}
        material={<meshStandardMaterial color="#f8fafc" />}
        position={[-0.45, 1.82, 1.22]}
      />
      <MeshPart
        geometry={<sphereGeometry args={[0.26, 16, 16]} />}
        material={<meshStandardMaterial color="#f8fafc" />}
        position={[0.45, 1.82, 1.22]}
      />
      <MeshPart
        geometry={<sphereGeometry args={[0.11, 12, 12]} />}
        material={<meshStandardMaterial color="#111827" />}
        position={[-0.45, 1.82, 1.42]}
      />
      <MeshPart
        geometry={<sphereGeometry args={[0.11, 12, 12]} />}
        material={<meshStandardMaterial color="#111827" />}
        position={[0.45, 1.82, 1.42]}
      />

      <group ref={frontL} position={[-0.82, 0.85, 0.82]}>
        <MeshPart
          geometry={<cylinderGeometry args={[0.12, 0.15, 0.85, 12]} />}
          material={<meshStandardMaterial color={bodyColor} roughness={0.9} />}
          position={[0, -0.34, 0]}
        />
      </group>

      <group ref={frontR} position={[0.82, 0.85, 0.82]}>
        <MeshPart
          geometry={<cylinderGeometry args={[0.12, 0.15, 0.85, 12]} />}
          material={<meshStandardMaterial color={bodyColor} roughness={0.9} />}
          position={[0, -0.34, 0]}
        />
      </group>

      <group ref={backL} position={[-1.08, 0.85, -0.55]}>
        <MeshPart
          geometry={<cylinderGeometry args={[0.16, 0.2, 1.1, 12]} />}
          material={<meshStandardMaterial color={bodyColor} roughness={0.9} />}
          position={[0.26, -0.38, 0.1]}
          rotation={[0, 0, -0.9]}
        />
      </group>

      <group ref={backR} position={[1.08, 0.85, -0.55]}>
        <MeshPart
          geometry={<cylinderGeometry args={[0.16, 0.2, 1.1, 12]} />}
          material={<meshStandardMaterial color={bodyColor} roughness={0.9} />}
          position={[-0.26, -0.38, 0.1]}
          rotation={[0, 0, 0.9]}
        />
      </group>
    </group>
  );
}

export function AlienEnemyModel({
  scale = 1,
  hit = false,
  moving = true,
}: {
  scale?: number;
  hit?: boolean;
  moving?: boolean;
}) {
  const root = useRef<THREE.Group>(null!);
  const armL = useRef<THREE.Group>(null!);
  const armR = useRef<THREE.Group>(null!);
  const legL = useRef<THREE.Group>(null!);
  const legR = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const swing = moving ? Math.sin(t * 7.5) : 0;
    const bob = moving ? Math.abs(Math.sin(t * 7.5)) * 0.12 : 0;

    root.current.position.y = bob;
    armL.current.rotation.x = swing * 0.65;
    armR.current.rotation.x = -swing * 0.65;
    legL.current.rotation.x = -swing * 0.65;
    legR.current.rotation.x = swing * 0.65;
  });

  const skin = hit ? "#d9f7ef" : "#92a79f";
  const chest = hit ? "#c7efe6" : "#6f827b";

  return (
    <group ref={root} scale={scale} className="alien-model">
      <MeshPart
        geometry={<capsuleGeometry args={[0.4, 1.65, 8, 18]} />}
        material={<meshStandardMaterial color={chest} roughness={0.86} />}
        position={[0, 1.8, 0]}
        scale={[0.95, 1.15, 0.75]}
      />

      <MeshPart
        geometry={<sphereGeometry args={[0.92, 28, 28]} />}
        material={<meshStandardMaterial color={skin} roughness={0.92} />}
        position={[0, 3.72, 0.04]}
        scale={[1.22, 1.48, 1.06]}
      />

      <MeshPart
        geometry={<sphereGeometry args={[0.34, 20, 20]} />}
        material={<meshStandardMaterial color="#09090b" roughness={0.45} />}
        position={[-0.34, 3.75, 0.7]}
        scale={[0.72, 1.7, 0.35]}
        rotation={[0, 0, -0.2]}
      />

      <MeshPart
        geometry={<sphereGeometry args={[0.34, 20, 20]} />}
        material={<meshStandardMaterial color="#09090b" roughness={0.45} />}
        position={[0.34, 3.75, 0.7]}
        scale={[0.72, 1.7, 0.35]}
        rotation={[0, 0, 0.2]}
      />

      <group ref={armL} position={[-0.5, 2.55, 0]}>
        <MeshPart
          geometry={<cylinderGeometry args={[0.08, 0.1, 1.35, 10]} />}
          material={<meshStandardMaterial color={skin} roughness={0.92} />}
          position={[0, -0.55, 0]}
        />
      </group>

      <group ref={armR} position={[0.5, 2.55, 0]}>
        <MeshPart
          geometry={<cylinderGeometry args={[0.08, 0.1, 1.35, 10]} />}
          material={<meshStandardMaterial color={skin} roughness={0.92} />}
          position={[0, -0.55, 0]}
        />
      </group>

      <group ref={legL} position={[-0.18, 1.04, 0]}>
        <MeshPart
          geometry={<cylinderGeometry args={[0.09, 0.11, 1.55, 10]} />}
          material={<meshStandardMaterial color={skin} roughness={0.92} />}
          position={[0, -0.72, 0]}
        />
      </group>

      <group ref={legR} position={[0.18, 1.04, 0]}>
        <MeshPart
          geometry={<cylinderGeometry args={[0.09, 0.11, 1.55, 10]} />}
          material={<meshStandardMaterial color={skin} roughness={0.92} />}
          position={[0, -0.72, 0]}
        />
      </group>
    </group>
  );
}

function Crystal({
  position,
  rotation,
  scale,
  color,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh castShadow receiveShadow>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.28}
          roughness={0.2}
          metalness={0.35}
        />
      </mesh>
    </group>
  );
}

export function ArenaBackground() {
  const crystalData = useMemo(
    () => [
      { position: [-17, 1.2, -18], rotation: [0, 0.6, 0], scale: [1.2, 2.6, 1.2], color: "#38bdf8" },
      { position: [18, 1.6, -15], rotation: [0, 0.3, 0], scale: [1.1, 3, 1.1], color: "#22d3ee" },
      { position: [-20, 1.3, 15], rotation: [0, 1.1, 0], scale: [1.15, 2.8, 1.15], color: "#c084fc" },
      { position: [20, 1.5, 18], rotation: [0, 0.7, 0], scale: [1.25, 3.2, 1.25], color: "#f472b6" },
      { position: [0, 1, -22], rotation: [0, 0.1, 0], scale: [1, 2.4, 1], color: "#67e8f9" },
      { position: [0, 1.1, 22], rotation: [0, 0.9, 0], scale: [1, 2.5, 1], color: "#60a5fa" },
    ],
    []
  );

  return (
    <group className="arena-bg">
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial
          color="#111827"
          roughness={0.98}
          metalness={0.08}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[2.2, 24, 64]} />
        <meshBasicMaterial color="#12314a" transparent opacity={0.55} />
      </mesh>

      <gridHelper args={[60, 30, "#2dd4bf", "#1e293b"]} position={[0, 0.02, 0]} />

      {crystalData.map((item, i) => (
        <Crystal
          key={i}
          position={item.position as [number, number, number]}
          rotation={item.rotation as [number, number, number]}
          scale={item.scale as [number, number, number]}
          color={item.color}
        />
      ))}

      <mesh position={[0, 1.5, -30]} receiveShadow castShadow>
        <boxGeometry args={[62, 3, 2]} />
        <meshStandardMaterial color="#243244" metalness={0.25} roughness={0.82} />
      </mesh>
      <mesh position={[0, 1.5, 30]} receiveShadow castShadow>
        <boxGeometry args={[62, 3, 2]} />
        <meshStandardMaterial color="#243244" metalness={0.25} roughness={0.82} />
      </mesh>
      <mesh position={[-30, 1.5, 0]} receiveShadow castShadow>
        <boxGeometry args={[2, 3, 62]} />
        <meshStandardMaterial color="#243244" metalness={0.25} roughness={0.82} />
      </mesh>
      <mesh position={[30, 1.5, 0]} receiveShadow castShadow>
        <boxGeometry args={[2, 3, 62]} />
        <meshStandardMaterial color="#243244" metalness={0.25} roughness={0.82} />
      </mesh>

      <mesh position={[0, 8, -28]}>
        <torusGeometry args={[12, 0.24, 16, 80]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#38bdf8"
          emissiveIntensity={0.7}
          metalness={0.55}
          roughness={0.18}
        />
      </mesh>
    </group>
  );
}