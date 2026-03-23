import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import "./App.css";

type EnemyKind = "frog" | "alien";

type EnemyType = {
  id: number;
  kind: EnemyKind;
  position: THREE.Vector3;
  health: number;
  maxHealth: number;
  speed: number;
  radius: number;
  damage: number;
  size: number;
  hitTimer: number;
};

type BulletType = {
  id: number;
  position: THREE.Vector3;
  direction: THREE.Vector3;
  damage: number;
};

type EffectType = {
  id: number;
  position: THREE.Vector3;
  life: number;
  maxLife: number;
  color: string;
};

type TouchState = {
  moveX: number;
  moveY: number;
  firing: boolean;
  aimPoint: THREE.Vector3 | null;
  joystickActive: boolean;
};

const MAP_LIMIT = 24;

function randomEnemyPosition() {
  const side = Math.floor(Math.random() * 4);
  const range = 22;
  const offset = (Math.random() - 0.5) * 34;

  switch (side) {
    case 0:
      return new THREE.Vector3(-range, 0.8, offset);
    case 1:
      return new THREE.Vector3(range, 0.8, offset);
    case 2:
      return new THREE.Vector3(offset, 0.8, -range);
    default:
      return new THREE.Vector3(offset, 0.8, range);
  }
}

function createEnemy(id: number, wave: number): EnemyType {
  const isAlien = Math.random() < 0.35;

  if (isAlien) {
    const health = 4 + Math.floor(wave * 0.5);
    return {
      id,
      kind: "alien",
      position: randomEnemyPosition(),
      health,
      maxHealth: health,
      speed: 1.45 + wave * 0.05,
      radius: 0.78,
      damage: 14,
      size: 1.8,
      hitTimer: 0,
    };
  }

  const health = 2 + Math.floor(wave * 0.25);
  return {
    id,
    kind: "frog",
    position: randomEnemyPosition(),
    health,
    maxHealth: health,
    speed: 2.5 + wave * 0.08,
    radius: 0.6,
    damage: 8,
    size: 1.45,
    hitTimer: 0,
  };
}

function EnemySprite({ enemy }: { enemy: EnemyType }) {
  const imgSrc = enemy.kind === "frog" ? "/frog.png" : "/alien.png";

  return (
    <group position={[enemy.position.x, enemy.position.y, enemy.position.z]}>
      <Html transform sprite distanceFactor={8}>
        <div className="enemy-wrap">
          <img
            src={imgSrc}
            alt={enemy.kind}
            className={`enemy-img ${enemy.hitTimer > 0 ? "enemy-hit" : ""}`}
            style={{
              width: `${enemy.size * 52}px`,
              height: `${enemy.size * 52}px`,
            }}
            draggable={false}
          />
          <div className="enemy-bar">
            <div
              className={`enemy-bar-fill ${
                enemy.kind === "alien" ? "enemy-bar-alien" : "enemy-bar-frog"
              }`}
              style={{
                width: `${(enemy.health / enemy.maxHealth) * 100}%`,
              }}
            />
          </div>
        </div>
      </Html>
    </group>
  );
}

function Game({
  setScore,
  wave,
  setWave,
  setHealth,
  gameOver,
  setGameOver,
  touchRef,
  restartTick,
}: {
  setScore: React.Dispatch<React.SetStateAction<number>>;
  wave: number;
  setWave: React.Dispatch<React.SetStateAction<number>>;
  setHealth: React.Dispatch<React.SetStateAction<number>>;
  gameOver: boolean;
  setGameOver: React.Dispatch<React.SetStateAction<boolean>>;
  touchRef: React.MutableRefObject<TouchState>;
  restartTick: number;
}) {
  const playerRef = useRef<THREE.Group>(null!);
  const keysRef = useRef<Record<string, boolean>>({});
  const mouseDownRef = useRef(false);
  const bulletIdRef = useRef(1000);
  const enemyIdRef = useRef(100);
  const effectIdRef = useRef(1);
  const shootCooldownRef = useRef(0);
  const damageCooldownRef = useRef(0);

  const { camera, gl, pointer } = useThree();

  const [enemies, setEnemies] = useState<EnemyType[]>(() =>
    Array.from({ length: 6 }, (_, i) => createEnemy(i, 1))
  );
  const [bullets, setBullets] = useState<BulletType[]>([]);
  const [effects, setEffects] = useState<EffectType[]>([]);

  const groundPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    []
  );
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouseWorldRef = useRef(new THREE.Vector3());

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (
        key === "w" ||
        key === "a" ||
        key === "s" ||
        key === "d" ||
        key === "arrowup" ||
        key === "arrowdown" ||
        key === "arrowleft" ||
        key === "arrowright" ||
        key === "r"
      ) {
        e.preventDefault();
      }

      keysRef.current[key] = true;
    };

    const up = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    const mouseDown = () => {
      mouseDownRef.current = true;
    };

    const mouseUp = () => {
      mouseDownRef.current = false;
    };

    window.addEventListener("keydown", down, { passive: false });
    window.addEventListener("keyup", up);
    window.addEventListener("mouseup", mouseUp);
    gl.domElement.addEventListener("mousedown", mouseDown);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("mouseup", mouseUp);
      gl.domElement.removeEventListener("mousedown", mouseDown);
    };
  }, [gl]);

  useEffect(() => {
    if (!playerRef.current) return;

    playerRef.current.position.set(0, 0, 0);
    playerRef.current.rotation.set(0, 0, 0);
    setBullets([]);
    setEffects([]);
    setEnemies(Array.from({ length: 6 }, (_, i) => createEnemy(i, 1)));
    bulletIdRef.current = 1000;
    enemyIdRef.current = 100;
    effectIdRef.current = 1;
    shootCooldownRef.current = 0;
    damageCooldownRef.current = 0;
  }, [restartTick]);

  useEffect(() => {
    if (!gameOver && enemies.length === 0) {
      const nextWave = wave + 1;
      const enemyCount = 5 + nextWave * 2;

      setWave(nextWave);
      setEnemies(
        Array.from({ length: enemyCount }, () =>
          createEnemy(enemyIdRef.current++, nextWave)
        )
      );
    }
  }, [enemies.length, gameOver, wave, setWave]);

  useFrame((_, delta) => {
    if (!playerRef.current) return;

    if (keysRef.current["r"] && gameOver) {
      playerRef.current.position.set(0, 0, 0);
      playerRef.current.rotation.set(0, 0, 0);
      setScore(0);
      setWave(1);
      setHealth(100);
      setGameOver(false);
      setBullets([]);
      setEffects([]);
      setEnemies(Array.from({ length: 6 }, (_, i) => createEnemy(i, 1)));
      bulletIdRef.current = 1000;
      enemyIdRef.current = 100;
      effectIdRef.current = 1;
      shootCooldownRef.current = 0;
      damageCooldownRef.current = 0;
      keysRef.current["r"] = false;
      return;
    }

    if (gameOver) return;

    if (shootCooldownRef.current > 0) shootCooldownRef.current -= delta;
    if (damageCooldownRef.current > 0) damageCooldownRef.current -= delta;

    const move = new THREE.Vector3();
    const speed = 7;
    const touch = touchRef.current;

    if (keysRef.current["w"] || keysRef.current["arrowup"]) move.z -= 1;
    if (keysRef.current["s"] || keysRef.current["arrowdown"]) move.z += 1;
    if (keysRef.current["a"] || keysRef.current["arrowleft"]) move.x -= 1;
    if (keysRef.current["d"] || keysRef.current["arrowright"]) move.x += 1;

    move.x += touch.moveX;
    move.z += touch.moveY;

    if (move.length() > 0) {
      move.normalize().multiplyScalar(speed * delta);
      playerRef.current.position.add(move);
    }

    playerRef.current.position.x = THREE.MathUtils.clamp(
      playerRef.current.position.x,
      -MAP_LIMIT,
      MAP_LIMIT
    );
    playerRef.current.position.z = THREE.MathUtils.clamp(
      playerRef.current.position.z,
      -MAP_LIMIT,
      MAP_LIMIT
    );

    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.intersectPlane(groundPlane, mouseWorldRef.current);

    const playerPos = playerRef.current.position;
    const aimTarget = touch.aimPoint ?? mouseWorldRef.current;
    const aimDir = aimTarget.clone().sub(playerPos);
    aimDir.y = 0;

    if (aimDir.length() > 0.001) {
      const angle = Math.atan2(aimDir.x, aimDir.z);
      playerRef.current.rotation.y = angle;
    }

    const wantsToFire = mouseDownRef.current || touch.firing;

    if (wantsToFire && shootCooldownRef.current <= 0) {
      const shootDir = aimTarget.clone().sub(playerPos);
      shootDir.y = 0;

      if (shootDir.length() > 0.001) {
        shootDir.normalize();

        const spawnPos = new THREE.Vector3(
          playerPos.x + shootDir.x * 1.1,
          0.35,
          playerPos.z + shootDir.z * 1.1
        );

        setBullets((prev) => [
          ...prev,
          {
            id: bulletIdRef.current++,
            position: spawnPos,
            direction: shootDir.clone(),
            damage: 1,
          },
        ]);

        shootCooldownRef.current = 0.12;
      }
    }

    camera.position.lerp(
      new THREE.Vector3(playerPos.x, 16, playerPos.z + 10),
      0.08
    );
    camera.lookAt(playerPos.x, 0, playerPos.z);

    setBullets((prevBullets) => {
      const updatedBullets: BulletType[] = [];

      for (const bullet of prevBullets) {
        const newPos = bullet.position
          .clone()
          .add(bullet.direction.clone().multiplyScalar(18 * delta));

        let hit = false;

        setEnemies((prevEnemies) => {
          let alreadyHit = false;

          const nextEnemies: EnemyType[] = [];
          const newEffectsLocal: EffectType[] = [];

          for (const enemy of prevEnemies) {
            if (
              !alreadyHit &&
              newPos.distanceTo(enemy.position) < enemy.radius + 0.18
            ) {
              alreadyHit = true;
              hit = true;

              const nextHealth = enemy.health - bullet.damage;
              const isDead = nextHealth <= 0;

              newEffectsLocal.push({
                id: effectIdRef.current++,
                position: enemy.position.clone(),
                life: isDead ? 0.35 : 0.18,
                maxLife: isDead ? 0.35 : 0.18,
                color: isDead ? "orange" : "white",
              });

              if (isDead) {
                setScore((prev) => prev + (enemy.kind === "alien" ? 25 : 10));
              } else {
                nextEnemies.push({
                  ...enemy,
                  health: nextHealth,
                  hitTimer: 0.08,
                });
              }
            } else {
              nextEnemies.push({
                ...enemy,
                hitTimer: Math.max(0, enemy.hitTimer - delta),
              });
            }
          }

          if (newEffectsLocal.length > 0) {
            setEffects((prev) => [...prev, ...newEffectsLocal]);
          }

          return nextEnemies;
        });

        const outOfBounds =
          Math.abs(newPos.x) > 35 || Math.abs(newPos.z) > 35;

        if (!hit && !outOfBounds) {
          updatedBullets.push({
            ...bullet,
            position: newPos,
          });
        }
      }

      return updatedBullets;
    });

    let totalDamage = 0;

    setEnemies((prevEnemies) =>
      prevEnemies.map((enemy) => {
        const dir = playerPos.clone().sub(enemy.position);
        dir.y = 0;

        let nextPos = enemy.position.clone();

        if (dir.length() > 0.1) {
          dir.normalize().multiplyScalar(enemy.speed * delta);
          nextPos = enemy.position.clone().add(dir);
        }

        nextPos.x = THREE.MathUtils.clamp(nextPos.x, -MAP_LIMIT, MAP_LIMIT);
        nextPos.z = THREE.MathUtils.clamp(nextPos.z, -MAP_LIMIT, MAP_LIMIT);

        if (nextPos.distanceTo(playerPos) < enemy.radius + 0.55) {
          totalDamage += enemy.damage;
        }

        return {
          ...enemy,
          position: nextPos,
          hitTimer: Math.max(0, enemy.hitTimer - delta),
        };
      })
    );

    if (totalDamage > 0 && damageCooldownRef.current <= 0) {
      setHealth((prev) => {
        const next = Math.max(0, prev - totalDamage);
        if (next <= 0) setGameOver(true);
        return next;
      });
      damageCooldownRef.current = 0.45;
    }

    setEffects((prev) =>
      prev
        .map((effect) => ({
          ...effect,
          life: effect.life - delta,
        }))
        .filter((effect) => effect.life > 0)
    );
  });

  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[6, 12, 6]} intensity={2.2} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>

      <gridHelper args={[60, 60, "#3f3f46", "#27272a"]} />

      <group ref={playerRef} position={[0, 0, 0]}>
        <mesh position={[0, 0.55, 0]}>
          <capsuleGeometry args={[0.38, 0.75, 4, 8]} />
          <meshStandardMaterial color={gameOver ? "#6b7280" : "deepskyblue"} />
        </mesh>

        <mesh position={[0, 0.65, 0.75]}>
          <boxGeometry args={[0.18, 0.18, 0.9]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
      </group>

      {enemies.map((enemy) => (
        <EnemySprite key={enemy.id} enemy={enemy} />
      ))}

      {bullets.map((bullet) => (
        <mesh
          key={bullet.id}
          position={[bullet.position.x, bullet.position.y, bullet.position.z]}
        >
          <sphereGeometry args={[0.14, 8, 8]} />
          <meshStandardMaterial color="yellow" emissive="gold" />
        </mesh>
      ))}

      {effects.map((effect) => {
        const t = effect.life / effect.maxLife;
        const scale = 1 + (1 - t) * 2.5;

        return (
          <mesh
            key={effect.id}
            position={[effect.position.x, 0.05, effect.position.z]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[scale, scale, scale]}
          >
            <ringGeometry args={[0.25, 0.55, 24]} />
            <meshBasicMaterial
              color={effect.color}
              transparent
              opacity={t}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}

      <mesh position={[0, 1.5, -30]}>
        <boxGeometry args={[62, 3, 2]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      <mesh position={[0, 1.5, 30]}>
        <boxGeometry args={[62, 3, 2]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      <mesh position={[-30, 1.5, 0]}>
        <boxGeometry args={[2, 3, 62]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      <mesh position={[30, 1.5, 0]}>
        <boxGeometry args={[2, 3, 62]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
    </>
  );
}

function TouchControls({
  touchRef,
  gameOver,
  onRestart,
}: {
  touchRef: React.MutableRefObject<TouchState>;
  gameOver: boolean;
  onRestart: () => void;
}) {
  const joystickRef = useRef<HTMLDivElement>(null);
  const joystickTouchIdRef = useRef<number | null>(null);
  const aimTouchIdRef = useRef<number | null>(null);

  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });

  const resetJoystick = () => {
    setStickPos({ x: 0, y: 0 });
    touchRef.current.moveX = 0;
    touchRef.current.moveY = 0;
    touchRef.current.joystickActive = false;
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    const zone = joystickRef.current;
    if (!zone) return;

    const rect = zone.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const maxDistance = rect.width * 0.3;
    const distance = Math.hypot(dx, dy);

    let x = dx;
    let y = dy;

    if (distance > maxDistance) {
      x = (dx / distance) * maxDistance;
      y = (dy / distance) * maxDistance;
    }

    setStickPos({ x, y });
    touchRef.current.moveX = x / maxDistance;
    touchRef.current.moveY = y / maxDistance;
    touchRef.current.joystickActive = true;
  };

  const updateAim = (clientX: number, clientY: number) => {
    const worldX = ((clientX / window.innerWidth) - 0.5) * 60;
    const worldZ = ((clientY / window.innerHeight) - 0.5) * 60;
    touchRef.current.aimPoint = new THREE.Vector3(worldX, 0, worldZ);
  };

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      for (const touch of Array.from(e.changedTouches)) {
        if (touch.identifier === joystickTouchIdRef.current) {
          updateJoystick(touch.clientX, touch.clientY);
        }

        if (touch.identifier === aimTouchIdRef.current) {
          updateAim(touch.clientX, touch.clientY);
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      for (const touch of Array.from(e.changedTouches)) {
        if (touch.identifier === joystickTouchIdRef.current) {
          joystickTouchIdRef.current = null;
          resetJoystick();
        }

        if (touch.identifier === aimTouchIdRef.current) {
          aimTouchIdRef.current = null;
          touchRef.current.aimPoint = null;
          touchRef.current.firing = false;
        }
      }
    };

    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);

    return () => {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [touchRef]);

  const handleJoystickTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.changedTouches[0];
    joystickTouchIdRef.current = touch.identifier;
    updateJoystick(touch.clientX, touch.clientY);
  };

  const handleAimStart = (e: React.TouchEvent<HTMLDivElement>) => {
    for (const touch of Array.from(e.changedTouches)) {
      const isRightHalf = touch.clientX > window.innerWidth * 0.5;
      if (aimTouchIdRef.current === null && isRightHalf) {
        aimTouchIdRef.current = touch.identifier;
        updateAim(touch.clientX, touch.clientY);
      }
    }
  };

  const handleAimMove = (e: React.TouchEvent<HTMLDivElement>) => {
    for (const touch of Array.from(e.changedTouches)) {
      if (touch.identifier === aimTouchIdRef.current) {
        updateAim(touch.clientX, touch.clientY);
      }
    }
  };

  const handleFireStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    touchRef.current.firing = true;
  };

  const handleFireEnd = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    touchRef.current.firing = false;
  };

  return (
    <div
      className="touch-layer"
      onTouchStart={handleAimStart}
      onTouchMove={handleAimMove}
    >
      <div className="left-control-group">
        <div className="control-label-card">
          <div className="control-label-title">MOVE</div>
          <div className="control-label-text">WASD / Arrows / Joystick</div>
        </div>

        <div
          ref={joystickRef}
          className="joystick-zone"
          onTouchStart={handleJoystickTouchStart}
        >
          <div className="joystick-ring" />
          <div
            className="joystick-stick"
            style={{
              transform: `translate(calc(-50% + ${stickPos.x}px), calc(-50% + ${stickPos.y}px))`,
            }}
          />
        </div>
      </div>

      <div className="right-control-group">
        <div className="control-label-card right-card">
          <div className="control-label-title">AIM / FIRE</div>
          <div className="control-label-text">Mouse / Right drag / FIRE</div>
        </div>

        <button
          className="fire-button"
          onTouchStart={handleFireStart}
          onTouchEnd={handleFireEnd}
          onTouchCancel={handleFireEnd}
        >
          FIRE
        </button>
      </div>

      {gameOver && (
        <button className="restart-touch-button" onClick={onRestart}>
          Restart
        </button>
      )}
    </div>
  );
}

export default function App() {
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [health, setHealth] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [restartTick, setRestartTick] = useState(0);

  const touchRef = useRef<TouchState>({
    moveX: 0,
    moveY: 0,
    firing: false,
    aimPoint: null,
    joystickActive: false,
  });

  const restartGame = () => {
    setScore(0);
    setWave(1);
    setHealth(100);
    setGameOver(false);
    setRestartTick((v) => v + 1);

    touchRef.current.moveX = 0;
    touchRef.current.moveY = 0;
    touchRef.current.firing = false;
    touchRef.current.aimPoint = null;
    touchRef.current.joystickActive = false;
  };

  return (
    <div className="app-shell">
      <Canvas camera={{ position: [0, 16, 10], fov: 50 }}>
        <Game
          setScore={setScore}
          wave={wave}
          setWave={setWave}
          setHealth={setHealth}
          gameOver={gameOver}
          setGameOver={setGameOver}
          touchRef={touchRef}
          restartTick={restartTick}
        />
      </Canvas>

      <div className="hud">
        <div>Score: {score}</div>
        <div>Wave: {wave}</div>

        <div className="health-title">Health</div>
        <div className="health-bar">
          <div
            className={`health-fill ${health > 35 ? "health-ok" : "health-low"}`}
            style={{ width: `${health}%` }}
          />
        </div>

        <div className="hud-info">Frog = fast, low HP</div>
        <div className="hud-info">Alien = slow, high HP</div>
      </div>

      <img src="/gun.png" alt="weapon" className="weapon-ui" draggable={false} />

      <TouchControls
        touchRef={touchRef}
        gameOver={gameOver}
        onRestart={restartGame}
      />

      {gameOver && (
        <div className="gameover-overlay">
          <div className="gameover-box">
            <h2>Game Over</h2>
            <p>Score: {score}</p>
            <p>Wave: {wave}</p>
            <p>Press R or tap Restart</p>
          </div>
        </div>
      )}
    </div>
  );
}