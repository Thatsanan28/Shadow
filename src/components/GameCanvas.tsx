import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { GameSettings, HighScore, MaskType } from '../types';
import { audio } from '../utils/audio';
import { 
  Volume2, VolumeX, Pause, Play, RotateCcw, Trophy, Award, Keyboard,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ArrowUp, Zap, LogOut, Swords, Sparkles
} from 'lucide-react';

interface GameCanvasProps {
  settings: GameSettings;
  onGameOver: (score: number) => void;
  onQuit: () => void;
}

// Global game state container accessed by the 3D loops and HUD
interface GameState {
  score: number;
  lives: number;
  gameOver: boolean;
  isPaused: boolean;
  dashCooldown: number;
  isDashing: boolean;
  invulnerableTimer: number;
  activeSkill: 'none' | 'attack' | 'dance';
  skillTimer: number;
}

// Component for beautifully spinning and floating 3D collectibles (Red Masks)
function SpinningItem3D({ x, y, z, type, texture }: { x: number; y: number; z: number; type: 'rice' | 'star' | 'mask'; texture: THREE.Texture | null }) {
  const groupRef = useRef<THREE.Group>(null);

  const col = useMemo(() => {
    if (type === 'star') return '#eab308';
    if (type === 'mask') return '#ef4444';
    return '#fbbf24'; // rice
  }, [type]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Bob up and down using a time offset based on coordinates so they bob out of phase
      const baseHeight = y;
      const bobbing = baseHeight <= 0.55 ? Math.sin(state.clock.elapsedTime * 4.0 + (x * 1.5 + z)) * 0.12 : 0;
      groupRef.current.position.set(x, baseHeight + bobbing, z);
      
      // Rotate/wobble back and forth slightly to look alive!
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2.5) * 0.12;
    }
  });

  return (
    <group ref={groupRef} position={[x, y, z]}>
      <Billboard follow={true}>
        {texture ? (
          <mesh castShadow>
            <planeGeometry args={[1.3, 1.3]} />
            <meshBasicMaterial map={texture} transparent={true} alphaTest={0.01} />
          </mesh>
        ) : (
          <mesh castShadow>
            <boxGeometry args={[0.55, 0.55, 0.55]} />
            <meshStandardMaterial color={col} roughness={0.15} metalness={0.7} emissive={col} emissiveIntensity={0.4} />
          </mesh>
        )}
      </Billboard>
      {/* Soft atmospheric halo glow */}
      <mesh position={[0, 0, -0.05]}>
        <sphereGeometry args={[0.55, 8, 8]} />
        <meshBasicMaterial color={col} transparent={true} opacity={0.15} />
      </mesh>
    </group>
  );
}

// Component for independent Enemy animations and effects using the 256x256 enemy.png sheet
function EnemySprite3D({
  texture,
  facing,
  isIdle,
  animFrame,
  blinkRedTimer,
  blinkWhiteTimer,
  isDead,
}: {
  texture: THREE.Texture;
  facing: 'left' | 'right';
  isIdle: boolean;
  animFrame: number;
  blinkRedTimer: number;
  blinkWhiteTimer: number;
  isDead: boolean;
}) {
  const [clonedTex] = useState(() => {
    const tex = texture.clone();
    tex.needsUpdate = true;
    return tex;
  });

  useEffect(() => {
    return () => {
      clonedTex.dispose();
    };
  }, [clonedTex]);

  useFrame(() => {
    // Row 1 (V offset = 0.5): Standing/Idle
    // Row 2 (V offset = 0.0): Walking/Running
    const rowOffset = isIdle ? 0.5 : 0.0;
    const colOffset = animFrame * 0.25;
    clonedTex.offset.set(colOffset, rowOffset);
  });

  const tintColor = useMemo(() => {
    if (blinkRedTimer > 0) {
      return '#ef4444';
    }
    if (blinkWhiteTimer > 0) {
      // Rapid white flashing using high frequency sine wave
      const active = Math.sin(Date.now() * 0.05) > 0;
      return active ? '#ffffff' : '#444444';
    }
    return '#ffffff';
  }, [blinkRedTimer, blinkWhiteTimer]);

  return (
    <mesh scale={[facing === 'right' ? -2.2 : 2.2, 2.2, 2.2]} castShadow>
      <planeGeometry args={[1.0, 1.0]} />
      <meshBasicMaterial 
        map={clonedTex} 
        transparent={true} 
        alphaTest={0.01} 
        color={tintColor}
      />
    </mesh>
  );
}

// Component for independent Boss animations using boss.png
function BossSprite3D({
  texture,
  facing,
  pattern,
  animFrame,
  blinkRedTimer,
  scaleFactor,
  isDead,
}: {
  texture: THREE.Texture;
  facing: 'left' | 'right';
  pattern: 'idle' | 'dashing' | 'warning' | 'shooting';
  animFrame: number;
  blinkRedTimer: number;
  scaleFactor: number;
  isDead: boolean;
}) {
  const [clonedTex] = useState(() => {
    const tex = texture.clone();
    tex.needsUpdate = true;
    return tex;
  });

  useEffect(() => {
    return () => {
      clonedTex.dispose();
    };
  }, [clonedTex]);

  useFrame(() => {
    // Row 1 (V offset = 0.5): Standing/Idle/Dashing/Warning
    // Row 2 (V offset = 0.0): Shooting
    const rowOffset = (pattern === 'shooting') ? 0.0 : 0.5;
    const colOffset = animFrame * 0.5;
    clonedTex.offset.set(colOffset, rowOffset);
  });

  const tintColor = useMemo(() => {
    if (blinkRedTimer > 0) {
      return '#ef4444';
    }
    if (isDead) {
      return '#4b5563';
    }
    return '#ffffff';
  }, [blinkRedTimer, isDead]);

  const baseSize = 4.8;
  const scaleX = (facing === 'right' ? -baseSize : baseSize) * scaleFactor;
  const scaleY = baseSize * scaleFactor;

  return (
    <mesh scale={[scaleX, scaleY, baseSize * scaleFactor]} castShadow>
      <planeGeometry args={[1.0, 1.0]} />
      <meshBasicMaterial 
        map={clonedTex} 
        transparent={true} 
        alphaTest={0.01} 
        color={tintColor}
      />
    </mesh>
  );
}

// Main 3D Game Scene Component
function GameScene3D({
  settings,
  isPaused,
  gameOver,
  score,
  setScore,
  lives,
  setLives,
  setGameOver,
  setDashCooldown,
  playerTexture,
  groundTexture,
  itemTexture,
  enemyTexture,
  grassTexture,
  bossTexture,
  setBossHealth,
  setShowEnding,
  virtualInput,
  onSpawnParticles,
}: {
  settings: GameSettings;
  isPaused: boolean;
  gameOver: boolean;
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  lives: number;
  setLives: React.Dispatch<React.SetStateAction<number>>;
  setGameOver: React.Dispatch<React.SetStateAction<boolean>>;
  setDashCooldown: React.Dispatch<React.SetStateAction<number>>;
  playerTexture: THREE.Texture | null;
  groundTexture: THREE.Texture | null;
  itemTexture: THREE.Texture | null;
  enemyTexture: THREE.Texture | null;
  grassTexture: THREE.Texture | null;
  bossTexture: THREE.Texture | null;
  setBossHealth: React.Dispatch<React.SetStateAction<number | null>>;
  setShowEnding: React.Dispatch<React.SetStateAction<boolean>>;
  virtualInput: React.MutableRefObject<any>;
  onSpawnParticles: (x: number, y: number, z: number, color: string, count: number) => void;
}) {
  const { camera } = useThree();

  // Player state references
  const playerPos = useRef(new THREE.Vector3(0, 0, 0));
  const playerState = useRef<'idle' | 'walk' | 'attack' | 'dance'>('idle');
  const playerFacing = useRef<'left' | 'right'>('right');
  const playerMeshRef = useRef<THREE.Mesh>(null);

  // Timers and movement parameters
  const attackTimer = useRef(0);
  const danceTimer = useRef(0);
  const invulnerableTimer = useRef(0);
  const dashTimer = useRef(0);
  const dashCooldownTimer = useRef(0);
  const frameTimer = useRef(0);
  const animFrame = useRef(0);

  // Entities state
  const ghosts = useRef<{
    id: number;
    position: THREE.Vector3;
    speed: number;
    type: string;
    health: number;
    blinkRedTimer: number;
    blinkWhiteTimer: number;
    knockbackDir: THREE.Vector3;
    knockbackSpeed: number;
    verticalVelocity: number;
    knockbackDuration: number;
    facing: 'left' | 'right';
    animFrame: number;
    frameTimer: number;
    isDead: boolean;
    deathTimer: number;
    isIdle: boolean;
  }[]>([]);
  const logs = useRef<{ id: number; position: THREE.Vector3; scale: number }[]>([]);
  const items = useRef<{ id: number; position: THREE.Vector3; type: 'rice' | 'star' | 'mask'; scale: number }[]>([]);
  const grasses = useRef<{ id: number; position: THREE.Vector3; scaleY: number; targetScaleY: number }[]>([]);

  // Local React triggers to sync rendering with state mutations
  const [renderGhosts, setRenderGhosts] = useState<{
    id: number;
    x: number;
    y: number;
    z: number;
    facing: 'left' | 'right';
    isIdle: boolean;
    animFrame: number;
    blinkRedTimer: number;
    blinkWhiteTimer: number;
    isDead: boolean;
  }[]>([]);
  const [renderLogs, setRenderLogs] = useState<{ id: number; x: number; z: number; scale: number }[]>([]);
  const [renderItems, setRenderItems] = useState<{ id: number; x: number; y: number; z: number; type: 'rice' | 'star' | 'mask' }[]>([]);
  const [renderGrasses, setRenderGrasses] = useState<{ id: number; x: number; z: number; scaleY: number }[]>([]);

  // Local states for custom skill visual overlays
  const [slashEffect, setSlashEffect] = useState<{ active: boolean; x: number; z: number; facing: 'left' | 'right' }>({
    active: false,
    x: 0,
    z: 0,
    facing: 'right',
  });
  const [danceMandala, setDanceMandala] = useState<{ active: boolean; x: number; z: number; radius: number }>({
    active: false,
    x: 0,
    z: 0,
    radius: 0,
  });

  // Defeated enemies counter
  const defeatedCount = useRef(0);
  
  // Boss state references
  const bossActive = useRef(false);
  const bossSpawned = useRef(false);
  const bossState = useRef<{
    id: number;
    position: THREE.Vector3;
    health: number;
    maxHealth: number;
    pattern: 'idle' | 'dashing' | 'warning' | 'shooting';
    patternTimer: number;
    dashTarget: THREE.Vector3;
    scaleFactor: number;
    blinkRedTimer: number;
    facing: 'left' | 'right';
    animFrame: number;
    frameTimer: number;
    isDead: boolean;
    deathTimer: number;
    lastHitTime?: number;
  } | null>(null);

  // local React state to trigger Boss rendering
  const [renderBoss, setRenderBoss] = useState<{
    position: [number, number, number];
    pattern: 'idle' | 'dashing' | 'warning' | 'shooting';
    animFrame: number;
    blinkRedTimer: number;
    scaleFactor: number;
    facing: 'left' | 'right';
    isDead: boolean;
  } | null>(null);

  // Fireball entities
  const fireballs = useRef<{
    id: number;
    position: THREE.Vector3;
    target: THREE.Vector3;
    startY: number;
    progress: number;
    speed: number;
    hit: boolean;
  }[]>([]);
  const nextFireballId = useRef(0);
  const [renderFireballs, setRenderFireballs] = useState<{
    id: number;
    x: number;
    y: number;
    z: number;
    targetX: number;
    targetZ: number;
    hit: boolean;
  }[]>([]);

  // Warp Portal entity
  const [warpPortal, setWarpPortal] = useState<{ active: boolean; x: number; z: number } | null>(null);

  // Track next entities IDs
  const nextGhostId = useRef(0);
  const nextLogId = useRef(0);
  const nextItemId = useRef(0);

  // Input states
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // Initialize ground elements: 6 wooden logs and 4 items
  useEffect(() => {
    // Spawns wood logs across the arena
    const initialLogs = [];
    for (let i = 0; i < 7; i++) {
      initialLogs.push({
        id: nextLogId.current++,
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 36,
          0.3,
          (Math.random() - 0.5) * 36
        ),
        scale: 0.8 + Math.random() * 0.5,
      });
    }
    logs.current = initialLogs;
    setRenderLogs(initialLogs.map((l) => ({ id: l.id, x: l.position.x, z: l.position.z, scale: l.scale })));

    // Spawns initial items
    const initialItems: { id: number; position: THREE.Vector3; type: 'rice' | 'star' | 'mask'; scale: number }[] = [];
    const types: ('rice' | 'star' | 'mask')[] = ['rice', 'star', 'mask'];
    for (let i = 0; i < 5; i++) {
      initialItems.push({
        id: nextItemId.current++,
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 38,
          10.0 + Math.random() * 4.0, // Start high up to fall down
          (Math.random() - 0.5) * 38
        ),
        type: types[i % types.length],
        scale: 1,
      });
    }
    items.current = initialItems;
    setRenderItems(initialItems.map((it) => ({ id: it.id, x: it.position.x, y: it.position.y, z: it.position.z, type: it.type })));

    // Spawns random grass patches (e.g., 22 patches)
    const initialGrasses = [];
    for (let i = 0; i < 22; i++) {
      initialGrasses.push({
        id: i,
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 44,
          0.45,
          (Math.random() - 0.5) * 44
        ),
        scaleY: 1.0,
        targetScaleY: 1.0,
      });
    }
    grasses.current = initialGrasses;
    setRenderGrasses(initialGrasses.map((g) => ({ id: g.id, x: g.position.x, z: g.position.z, scaleY: g.scaleY })));
  }, []);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver || isPaused) return;
      keysPressed.current[e.key.toLowerCase()] = true;
      keysPressed.current[e.key] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
      keysPressed.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameOver, isPaused]);

  // Periodic Spawner for Ghosts & additional items
  useEffect(() => {
    if (gameOver || isPaused) return;

    let ghostTimeoutId: any = null;

    const spawnGhostWithRandomDelay = () => {
      if (gameOver || isPaused) return;

      // Spawning Boss check
      if (defeatedCount.current >= 10 && !bossSpawned.current) {
        bossSpawned.current = true;
        bossActive.current = true;
        
        bossState.current = {
          id: 9999,
          position: new THREE.Vector3(0, 3.5, -12),
          health: 10,
          maxHealth: 10,
          pattern: 'idle',
          patternTimer: 3.0,
          dashTarget: new THREE.Vector3(),
          scaleFactor: 1.0,
          blinkRedTimer: 0,
          facing: 'left',
          animFrame: 0,
          frameTimer: 0,
          isDead: false,
          deathTimer: 0,
          lastHitTime: 0,
        };

        setBossHealth(10);
        setRenderBoss({
          position: [0, 3.5, -12],
          pattern: 'idle',
          animFrame: 0,
          blinkRedTimer: 0,
          scaleFactor: 1.0,
          facing: 'left',
          isDead: false,
        });

        // Spawn beautiful welcoming particles
        onSpawnParticles(0, 3.5, -12, '#a855f7', 40);
        onSpawnParticles(0, 3.5, -12, '#fbbf24', 20);
      }

      // Spawn at arena edge relative to player
      const angle = Math.random() * Math.PI * 2;
      const distance = 16 + Math.random() * 10;
      const x = playerPos.current.x + Math.cos(angle) * distance;
      const z = playerPos.current.z + Math.sin(angle) * distance;

      // Restrict spawn points within ground bounds [-23, 23]
      const clampedX = Math.max(-23, Math.min(23, x));
      const clampedZ = Math.max(-23, Math.min(23, z));

      const newGhost = {
        id: nextGhostId.current++,
        position: new THREE.Vector3(clampedX, 0.8, clampedZ),
        speed: 2.2 + Math.random() * 1.8,
        type: 'spirit',
        health: 2,
        blinkRedTimer: 0,
        blinkWhiteTimer: 0,
        knockbackDir: new THREE.Vector3(),
        knockbackSpeed: 0,
        verticalVelocity: 0,
        knockbackDuration: 0,
        facing: 'left' as 'left' | 'right',
        animFrame: 0,
        frameTimer: 0,
        isDead: false,
        deathTimer: 0,
        isIdle: false,
      };

      ghosts.current.push(newGhost);
      setRenderGhosts(
        ghosts.current.map((g: any) => ({
          id: g.id,
          x: g.position.x,
          y: g.position.y,
          z: g.position.z,
          facing: g.facing || 'left',
          isIdle: g.isIdle || false,
          animFrame: g.animFrame || 0,
          blinkRedTimer: g.blinkRedTimer || 0,
          blinkWhiteTimer: g.blinkWhiteTimer || 0,
          isDead: g.isDead || false,
        }))
      );

      // schedule next spawn randomly in 1-3 seconds (1000 - 3000ms)
      const nextDelay = 1000 + Math.random() * 2000;
      ghostTimeoutId = setTimeout(spawnGhostWithRandomDelay, nextDelay);
    };

    // Start spawn loop
    ghostTimeoutId = setTimeout(spawnGhostWithRandomDelay, 1500);

    // Periodically spawn items if they run low
    const itemInterval = setInterval(() => {
      if (items.current.length < 5) {
        const types: ('rice' | 'star' | 'mask')[] = ['rice', 'star', 'mask'];
        const newItem = {
          id: nextItemId.current++,
          position: new THREE.Vector3(
            (Math.random() - 0.5) * 40,
            12.0, // Falling from altitude
            (Math.random() - 0.5) * 40
          ),
          type: types[Math.floor(Math.random() * types.length)],
          scale: 1,
        };
        items.current.push(newItem);
        setRenderItems(items.current.map((it) => ({ id: it.id, x: it.position.x, y: it.position.y, z: it.position.z, type: it.type })));
      }
    }, 4000);

    return () => {
      clearTimeout(ghostTimeoutId);
      clearInterval(itemInterval);
    };
  }, [gameOver, isPaused]);

  // Framerate logic processing position updates, collision detection, and spritesheets
  useFrame((state, delta) => {
    if (isPaused || gameOver) return;

    // Cap delta to prevent massive physics jumps
    const dt = Math.min(delta, 0.1);

    // 1. UPDATE TIMERS
    if (attackTimer.current > 0) {
      attackTimer.current -= dt;
      if (attackTimer.current <= 0) {
        playerState.current = 'idle';
        setSlashEffect((prev) => ({ ...prev, active: false }));
      }
    }
    if (danceTimer.current > 0) {
      danceTimer.current -= dt;
      setDanceMandala((prev) => ({
        ...prev,
        radius: Math.min(9.0, prev.radius + dt * 6),
      }));
      if (danceTimer.current <= 0) {
        playerState.current = 'idle';
        setDanceMandala((prev) => ({ ...prev, active: false }));
      }
    }
    if (invulnerableTimer.current > 0) {
      invulnerableTimer.current -= dt;
    }
    if (dashTimer.current > 0) {
      dashTimer.current -= dt;
    }
    if (dashCooldownTimer.current > 0) {
      dashCooldownTimer.current = Math.max(0, dashCooldownTimer.current - dt);
      setDashCooldown(dashCooldownTimer.current);
    }

    // 2. INPUT & 8-DIRECTION MOVEMENT
    let moveX = 0;
    let moveZ = 0;

    // Read keys & virtual mobile buttons
    if (keysPressed.current['w'] || keysPressed.current['ArrowUp'] || virtualInput.current.up) moveZ = -1;
    if (keysPressed.current['s'] || keysPressed.current['ArrowDown'] || virtualInput.current.down) moveZ = 1;
    if (keysPressed.current['a'] || keysPressed.current['ArrowLeft'] || virtualInput.current.left) moveX = -1;
    if (keysPressed.current['d'] || keysPressed.current['ArrowRight'] || virtualInput.current.right) moveX = 1;

    // Normalize movement vectors
    const moveLength = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (moveLength > 0) {
      moveX /= moveLength;
      moveZ /= moveLength;
      if (playerState.current !== 'attack' && playerState.current !== 'dance') {
        playerState.current = 'walk';
      }
      if (moveX < 0) playerFacing.current = 'left';
      if (moveX > 0) playerFacing.current = 'right';
    } else {
      if (playerState.current !== 'attack' && playerState.current !== 'dance') {
        playerState.current = 'idle';
      }
    }

    // Determine speed
    let speed = 11.0;
    if (dashTimer.current > 0) {
      speed = 26.0; // Dash speed boost
    } else if (playerState.current === 'attack') {
      speed = 3.0; // Decelerate during swing
    } else if (playerState.current === 'dance') {
      speed = 0.0; // Lock in place during dance
    }

    // Apply translation with boundaries clamp
    playerPos.current.x += moveX * speed * dt;
    playerPos.current.z += moveZ * speed * dt;
    playerPos.current.x = Math.max(-24.2, Math.min(24.2, playerPos.current.x));
    playerPos.current.z = Math.max(-24.2, Math.min(24.2, playerPos.current.z));

    // 3. COMBAT ACTIONS - ATTACK & DANCE SKILLS
    // P -> Attack
    if ((keysPressed.current['p'] || virtualInput.current.attack) && playerState.current !== 'dance' && attackTimer.current <= 0) {
      playerState.current = 'attack';
      attackTimer.current = 0.45; // 0.45s attack state duration
      audio.playSlash();

      // Trigger sword sweep overlay effect
      setSlashEffect({
        active: true,
        x: playerPos.current.x + (playerFacing.current === 'right' ? 1.5 : -1.5),
        z: playerPos.current.z,
        facing: playerFacing.current,
      });

      // Spawn slash wood-sweep sparkles
      onSpawnParticles(
        playerPos.current.x + (playerFacing.current === 'right' ? 1.8 : -1.8),
        0.8,
        playerPos.current.z,
        '#f59e0b',
        8
      );

      // Reset keyboard pressed trigger to avoid infinite looping
      keysPressed.current['p'] = false;
      virtualInput.current.attack = false;
    }

    // O -> Sacred Dance Skill
    if ((keysPressed.current['o'] || virtualInput.current.dance) && playerState.current !== 'dance' && playerState.current !== 'attack') {
      playerState.current = 'dance';
      danceTimer.current = 1.5; // 1.5s dance choreography
      audio.playCollect();

      // Expand defensive/blessed Thai-Art mandala field
      setDanceMandala({
        active: true,
        x: playerPos.current.x,
        z: playerPos.current.z,
        radius: 1.0,
      });

      // Invulnerable status + heal 1 heart
      invulnerableTimer.current = 3.0;
      setLives((prev) => Math.min(5, prev + 1));

      // Shower beautiful upward magical sparkles
      for (let i = 0; i < 15; i++) {
        setTimeout(() => {
          onSpawnParticles(
            playerPos.current.x + (Math.random() - 0.5) * 4,
            0.2,
            playerPos.current.z + (Math.random() - 0.5) * 4,
            '#a855f7',
            3
          );
        }, i * 100);
      }

      // Reset triggers
      keysPressed.current['o'] = false;
      virtualInput.current.dance = false;
    }

    // Shift / Space / virtualInput.dash -> Dash
    if ((keysPressed.current['shift'] || keysPressed.current[' '] || virtualInput.current.dash) && dashCooldownTimer.current === 0 && dashTimer.current === 0) {
      dashTimer.current = 0.22;
      dashCooldownTimer.current = 1.6;
      invulnerableTimer.current = 0.5;
      audio.playJump();

      onSpawnParticles(playerPos.current.x, 0.4, playerPos.current.z, '#fbbf24', 10);

      keysPressed.current['shift'] = false;
      keysPressed.current[' '] = false;
      virtualInput.current.dash = false;
    }

    // 4. ENTITY LOOPS & COLLISIONS
    const pX = playerPos.current.x;
    const pZ = playerPos.current.z;

    // A. Update Ghost/Enemy Entities physics & states
    ghosts.current.forEach((ghost: any) => {
      // 1. Apply knockback physics
      if (ghost.knockbackDuration > 0) {
        ghost.knockbackDuration -= dt;
        ghost.position.addScaledVector(ghost.knockbackDir, ghost.knockbackSpeed * dt);
        ghost.knockbackSpeed = Math.max(0, ghost.knockbackSpeed - dt * 45.0); // slow down quickly
        
        // If dead, apply vertical flying speed
        if (ghost.isDead && ghost.verticalVelocity !== undefined) {
          ghost.position.y += ghost.verticalVelocity * dt;
          ghost.verticalVelocity -= 28.0 * dt; // gravity
        }
      } else {
        if (!ghost.isDead) {
          ghost.position.y = 0.8;
        }
      }

      // 2. Reduce visual blink & death timers
      if (ghost.blinkRedTimer > 0) ghost.blinkRedTimer -= dt;
      if (ghost.blinkWhiteTimer > 0) ghost.blinkWhiteTimer -= dt;
      if (ghost.deathTimer > 0) ghost.deathTimer -= dt;

      // 3. Normal AI walk towards player (if not dead and not knocked back)
      if (ghost.knockbackDuration <= 0 && !ghost.isDead) {
        const dirX = pX - ghost.position.x;
        const dirZ = pZ - ghost.position.z;
        const dist = Math.sqrt(dirX * dirX + dirZ * dirZ);

        if (dist > 0.05) {
          ghost.position.x += (dirX / dist) * ghost.speed * dt;
          ghost.position.z += (dirZ / dist) * ghost.speed * dt;
          ghost.facing = dirX < 0 ? 'left' : 'right';
          ghost.isIdle = false;
        } else {
          ghost.isIdle = true;
        }
      } else if (ghost.isDead) {
        ghost.isIdle = true;
      }

      // 4. Update frame animations
      if (ghost.frameTimer === undefined) ghost.frameTimer = 0;
      if (ghost.animFrame === undefined) ghost.animFrame = 0;

      ghost.frameTimer += dt;
      const animSpeed = ghost.isIdle ? 0.25 : 0.14;
      if (ghost.frameTimer >= animSpeed) {
        ghost.frameTimer = 0;
        ghost.animFrame = (ghost.animFrame + 1) % 4;
      }
    });

    // Handle Attack Sweep vs Enemies & Player Damage collisions
    const survivedGhosts = ghosts.current.filter((ghost: any) => {
      // If dead and its fly-away/death timer is done, remove it
      if (ghost.isDead) {
        return (ghost.deathTimer || 0) > 0;
      }

      const dx = pX - ghost.position.x;
      const dz = pZ - ghost.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // Attack Hit checking (Wooden Sword slash sweep)
      if (attackTimer.current > 0) {
        const attackRadius = 3.5;
        const inFront = playerFacing.current === 'right' 
          ? ghost.position.x > pX - 0.5 
          : ghost.position.x < pX + 0.5;

        if (dist <= attackRadius && inFront) {
          const now = state.clock.elapsedTime;
          if (now - (ghost.lastHitTime || 0) > 0.45) {
            ghost.lastHitTime = now;
            ghost.health = (ghost.health || 2) - 1;

            if (ghost.health > 0) {
              // FIRST HIT: Knock back in direction opposite to player, blink red, play sound
              audio.playHit();
              setScore((s) => s + 100);
              const kbDir = new THREE.Vector3().subVectors(ghost.position, playerPos.current).setY(0).normalize();
              if (kbDir.lengthSq() < 0.01) {
                kbDir.set(playerFacing.current === 'right' ? 1.0 : -1.0, 0, 0).normalize();
              }
              ghost.knockbackDir = kbDir;
              ghost.knockbackSpeed = 16.0;
              ghost.knockbackDuration = 0.35;
              ghost.blinkRedTimer = 0.35;
              onSpawnParticles(ghost.position.x, 0.8, ghost.position.z, '#fbbf24', 15);
            } else {
              // SECOND HIT: Fly far away + rapid white blink, then vanish
              audio.playHit();
              setScore((s) => s + 250);
              const kbDir = new THREE.Vector3().subVectors(ghost.position, playerPos.current).setY(0).normalize();
              if (kbDir.lengthSq() < 0.01) {
                kbDir.set(playerFacing.current === 'right' ? 1.0 : -1.0, 0, 0).normalize();
              }
              ghost.knockbackDir = kbDir;
              ghost.knockbackSpeed = 45.0; // flies out of boundary!
              ghost.knockbackDuration = 0.55;
              ghost.verticalVelocity = 16.0; // fly up!
              ghost.blinkWhiteTimer = 0.55;
              ghost.isDead = true;
              ghost.deathTimer = 0.55;
              onSpawnParticles(ghost.position.x, 0.8, ghost.position.z, '#ffffff', 25);
              defeatedCount.current += 1;
            }
          }
        }
      }

      // Sacred Dance mandala wave impact (Instant defeat flyaway!)
      if (danceTimer.current > 0 && danceMandala.active) {
        if (dist <= danceMandala.radius) {
          const now = state.clock.elapsedTime;
          if (now - (ghost.lastHitTime || 0) > 0.45) {
            ghost.lastHitTime = now;
            audio.playHit();
            setScore((s) => s + 150);
            const kbDir = new THREE.Vector3().subVectors(ghost.position, playerPos.current).setY(0).normalize();
            if (kbDir.lengthSq() < 0.01) {
              kbDir.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
            }
            ghost.knockbackDir = kbDir;
            ghost.knockbackSpeed = 45.0;
            ghost.knockbackDuration = 0.55;
            ghost.verticalVelocity = 16.0;
            ghost.blinkWhiteTimer = 0.55;
            ghost.isDead = true;
            ghost.deathTimer = 0.55;
            onSpawnParticles(ghost.position.x, 0.8, ghost.position.z, '#ff007f', 20);
            defeatedCount.current += 1;
          }
        }
      }

      // Collision damage to player
      if (dist < 1.1) {
        if (invulnerableTimer.current <= 0 && dashTimer.current <= 0) {
          audio.playHit();
          setLives((l) => {
            const nextL = l - 1;
            if (nextL <= 0) {
              setGameOver(true);
              audio.stopMusic();
            }
            return nextL;
          });
          invulnerableTimer.current = 1.6;
          onSpawnParticles(pX, 0.8, pZ, '#ef4444', 12);

          // Blink red on attack execution!
          ghost.blinkRedTimer = 0.5;

          // Push back enemy slightly
          const kbDir = new THREE.Vector3().subVectors(ghost.position, playerPos.current).setY(0).normalize();
          ghost.knockbackDir = kbDir;
          ghost.knockbackSpeed = 10.0;
          ghost.knockbackDuration = 0.25;
        }
      }

      return true;
    });

    // Update state to trigger React renderings
    setRenderGhosts(
      survivedGhosts.map((g: any) => ({
        id: g.id,
        x: g.position.x,
        y: g.position.y,
        z: g.position.z,
        facing: g.facing || 'left',
        isIdle: g.isIdle || false,
        animFrame: g.animFrame || 0,
        blinkRedTimer: g.blinkRedTimer || 0,
        blinkWhiteTimer: g.blinkWhiteTimer || 0,
        isDead: g.isDead || false,
      }))
    );
    // Persist list
    ghosts.current = survivedGhosts;

    // C. BOSS STATE MACHINE & BEHAVIOR
    if (bossActive.current && bossState.current) {
      const boss = bossState.current;
      
      // 1. Decrement timers
      if (boss.blinkRedTimer > 0) boss.blinkRedTimer -= dt;
      boss.patternTimer -= dt;

      // 2. State selection
      if (boss.patternTimer <= 0) {
        if (boss.pattern === 'idle') {
          // 50% dash, 50% prepare attack
          if (Math.random() > 0.5) {
            boss.pattern = 'dashing';
            boss.patternTimer = 1.0;
            // Target spot near player, but restricted to arena
            const range = 12.0;
            boss.dashTarget.set(
              Math.max(-20, Math.min(20, pX + (Math.random() - 0.5) * range)),
              3.5,
              Math.max(-20, Math.min(20, pZ + (Math.random() - 0.5) * range))
            );
            boss.facing = boss.dashTarget.x < boss.position.x ? 'left' : 'right';
            audio.playJump();
          } else {
            boss.pattern = 'warning';
            boss.patternTimer = 1.6;
          }
        } else if (boss.pattern === 'dashing') {
          boss.pattern = 'warning';
          boss.patternTimer = 1.6;
        } else if (boss.pattern === 'warning') {
          boss.pattern = 'shooting';
          boss.patternTimer = 2.0;

          // SHOOT FIREBALLS UPWARDS!
          // Spawn 5 fireballs targeted around the player's vicinity
          for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 + Math.random() * 0.5;
            const radius = 2.0 + Math.random() * 4.5;
            const targetX = Math.max(-22, Math.min(22, pX + Math.cos(angle) * radius));
            const targetZ = Math.max(-22, Math.min(22, pZ + Math.sin(angle) * radius));

            const fb = {
              id: nextFireballId.current++,
              position: new THREE.Vector3(boss.position.x, boss.position.y + 1.5, boss.position.z),
              target: new THREE.Vector3(targetX, 0.4, targetZ),
              startY: boss.position.y + 1.5,
              progress: 0.0,
              speed: 0.7 + Math.random() * 0.4,
              hit: false,
            };
            fireballs.current.push(fb);
          }
          audio.playClick();
        } else if (boss.pattern === 'shooting') {
          boss.pattern = 'idle';
          boss.patternTimer = 2.5;
        }
      }

      // 3. Movement and animations
      if (boss.pattern === 'idle') {
        boss.scaleFactor = 1.0;
        // Hover towards player at Y = 3.2 + wave
        const targetHoverX = pX;
        const targetHoverZ = pZ - 4.5;
        boss.position.x += (targetHoverX - boss.position.x) * dt * 1.5;
        boss.position.z += (targetHoverZ - boss.position.z) * dt * 1.5;
        boss.position.y = 3.2 + Math.sin(state.clock.elapsedTime * 3.0) * 0.4;
        boss.facing = pX < boss.position.x ? 'left' : 'right';
      } else if (boss.pattern === 'dashing') {
        boss.scaleFactor = 1.0;
        boss.position.lerp(boss.dashTarget, dt * 6.0);
        onSpawnParticles(boss.position.x, boss.position.y, boss.position.z, '#fbbf24', 2);
      } else if (boss.pattern === 'warning') {
        // Step pulse scale
        const pulse = Math.floor(state.clock.elapsedTime * 10) % 2;
        boss.scaleFactor = pulse === 0 ? 0.85 : 1.35;
        boss.position.y = 3.2 + Math.sin(state.clock.elapsedTime * 6.0) * 0.2;
      } else if (boss.pattern === 'shooting') {
        boss.scaleFactor = 1.1;
        boss.position.y = 3.5;
      }

      // 4. Hit anim timer
      boss.frameTimer += dt;
      if (boss.frameTimer >= 0.22) {
        boss.frameTimer = 0;
        boss.animFrame = (boss.animFrame + 1) % 2;
      }

      // 5. Collision Sword/Dance hit vs Boss
      if (attackTimer.current > 0 || (danceTimer.current > 0 && danceMandala.active)) {
        const attackRadius = 5.0;
        const now = state.clock.elapsedTime;

        const bX = boss.position.x;
        const bZ = boss.position.z;
        const dx = bX - pX;
        const dz = bZ - pZ;
        const dist2D = Math.sqrt(dx * dx + dz * dz);

        const inFront = playerFacing.current === 'right' ? bX > pX - 0.5 : bX < pX + 0.5;

        const isHitPhysically = (attackTimer.current > 0 && dist2D <= attackRadius && inFront);
        const isHitByDance = (danceTimer.current > 0 && danceMandala.active && dist2D <= danceMandala.radius);

        if ((isHitPhysically || isHitByDance) && (now - (boss.lastHitTime || 0) > 0.6)) {
          boss.lastHitTime = now;
          boss.health -= 1;
          boss.blinkRedTimer = 0.4;
          
          audio.playHit();
          setScore((s) => s + 500);
          setBossHealth(boss.health);
          onSpawnParticles(bX, boss.position.y, bZ, '#ef4444', 25);
          onSpawnParticles(bX, boss.position.y, bZ, '#fbbf24', 15);

          if (boss.health <= 0) {
            boss.isDead = true;
            boss.deathTimer = 1.5;
            bossActive.current = false;
            setBossHealth(null);

            onSpawnParticles(bX, boss.position.y, bZ, '#ffffff', 50);
            onSpawnParticles(bX, boss.position.y, bZ, '#fbbf24', 40);
            
            setWarpPortal({ active: true, x: bX, z: bZ });
          }
        }
      }

      // 6. Push render states
      setRenderBoss({
        position: [boss.position.x, boss.position.y, boss.position.z],
        pattern: boss.pattern,
        animFrame: boss.animFrame,
        blinkRedTimer: boss.blinkRedTimer,
        scaleFactor: boss.scaleFactor,
        facing: boss.facing,
        isDead: boss.isDead,
      });

      // 7. Boss touch damage to player
      const dx = boss.position.x - pX;
      const dz = boss.position.z - pZ;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 1.8 && invulnerableTimer.current <= 0 && dashTimer.current <= 0) {
        audio.playHit();
        setLives((l) => {
          const nextL = l - 1;
          if (nextL <= 0) {
            setGameOver(true);
            audio.stopMusic();
          }
          return nextL;
        });
        invulnerableTimer.current = 1.6;
        onSpawnParticles(pX, 0.8, pZ, '#ef4444', 15);
      }
    }

    // D. FIREBALLS PHYSICS & UPDATE
    const activeFireballs = fireballs.current.filter((fb) => {
      if (fb.hit) return false;

      fb.progress += dt * fb.speed;

      if (fb.progress < 0.4) {
        const t = fb.progress / 0.4;
        fb.position.x = THREE.MathUtils.lerp(fb.position.x, fb.target.x, t);
        fb.position.z = THREE.MathUtils.lerp(fb.position.z, fb.target.z, t);
        fb.position.y = THREE.MathUtils.lerp(fb.startY, 12.0, t);
      } else if (fb.progress < 1.0) {
        const t = (fb.progress - 0.4) / 0.6;
        fb.position.x = fb.target.x;
        fb.position.z = fb.target.z;
        fb.position.y = THREE.MathUtils.lerp(12.0, 0.4, t);
      } else {
        fb.hit = true;
        fb.position.copy(fb.target);
        
        audio.playHit();
        onSpawnParticles(fb.target.x, 0.4, fb.target.z, '#f97316', 20);
        onSpawnParticles(fb.target.x, 0.4, fb.target.z, '#ef4444', 10);

        const dx = pX - fb.target.x;
        const dz = pZ - fb.target.z;
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d < 1.8 && invulnerableTimer.current <= 0 && dashTimer.current <= 0) {
          audio.playHit();
          setLives((l) => {
            const nextL = l - 1;
            if (nextL <= 0) {
              setGameOver(true);
              audio.stopMusic();
            }
            return nextL;
          });
          invulnerableTimer.current = 1.6;
          onSpawnParticles(pX, 0.8, pZ, '#ef4444', 15);
        }
        return false;
      }
      return true;
    });

    fireballs.current = activeFireballs;
    setRenderFireballs(
      fireballs.current.map((fb) => ({
        id: fb.id,
        x: fb.position.x,
        y: fb.position.y,
        z: fb.position.z,
        targetX: fb.target.x,
        targetZ: fb.target.z,
        hit: fb.hit,
      }))
    );

    // E. WARP PORTAL COLLISION CHECK
    if (warpPortal && warpPortal.active) {
      const dx = pX - warpPortal.x;
      const dz = pZ - warpPortal.z;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < 1.5) {
        audio.playCollect();
        setShowEnding(true);
        setGameOver(true);
      }
    }

    // B. Check Wood Logs collision & breaks
    const survivedLogs = logs.current.filter((log) => {
      const dx = pX - log.position.x;
      const dz = pZ - log.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // Solid collision block push-out
      const minCollideDist = 1.2 * log.scale;
      if (dist < minCollideDist && dist > 0.1) {
        // Push player back
        playerPos.current.x = log.position.x + (dx / dist) * minCollideDist;
        playerPos.current.z = log.position.z + (dz / dist) * minCollideDist;
      }

      // Wooden Sword attacking log
      if (attackTimer.current > 0) {
        const attackRadius = 3.2;
        const inFront = playerFacing.current === 'right' 
          ? log.position.x > pX - 0.5 
          : log.position.x < pX + 0.5;

        if (dist <= attackRadius && inFront) {
          audio.playHit();
          setScore((s) => s + 50);
          onSpawnParticles(log.position.x, 0.4, log.position.z, '#b45309', 14); // Wood shards
          return false; // Log splits and breaks!
        }
      }

      // Sacred mandala bursts logs too!
      if (danceTimer.current > 0 && danceMandala.active) {
        if (dist <= danceMandala.radius) {
          audio.playHit();
          setScore((s) => s + 60);
          onSpawnParticles(log.position.x, 0.4, log.position.z, '#d97706', 10);
          return false;
        }
      }

      return true;
    });

    if (survivedLogs.length !== logs.current.length) {
      logs.current = survivedLogs;
      setRenderLogs(survivedLogs.map((l) => ({ id: l.id, x: l.position.x, z: l.position.z, scale: l.scale })));
    }

    // Apply gravity/falling downward speed to any item in the air
    items.current.forEach((it) => {
      if (it.position.y > 0.5) {
        it.position.y = Math.max(0.5, it.position.y - dt * 8.0); // smooth fall
      }
    });

    // C. Check Collectible Item collisions
    const survivedItems = items.current.filter((it) => {
      const dx = pX - it.position.x;
      const dz = pZ - it.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // Only collectable if close to player and near the ground level
      if (dist < 1.3 && it.position.y < 2.5) {
        audio.playCollect();
        let pts = 150;
        let color = '#ef4444'; // Red theme matching the mask

        if (it.type === 'star') {
          pts = 250;
        } else if (it.type === 'mask') {
          pts = 350;
        }

        // เติมพลัง: Restore health up to max 5!
        setLives((prev) => Math.min(5, prev + 1));

        setScore((s) => s + pts);
        onSpawnParticles(it.position.x, 0.6, it.position.z, color, 12);
        return false; // Collected!
      }
      return true;
    });

    if (survivedItems.length !== items.current.length) {
      items.current = survivedItems;
      setRenderItems(survivedItems.map((it) => ({ id: it.id, x: it.position.x, y: it.position.y, z: it.position.z, type: it.type })));
    } else {
      setRenderItems(items.current.map((it) => ({ id: it.id, x: it.position.x, y: it.position.y, z: it.position.z, type: it.type })));
    }

    // D. Update Grass squash & stretch logic based on distance to player
    let grassChanged = false;
    grasses.current.forEach((g) => {
      const dx = pX - g.position.x;
      const dz = pZ - g.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      const oldScaleY = g.scaleY;
      if (dist < 1.1) {
        g.targetScaleY = 0.15; // squash flat
      } else {
        g.targetScaleY = 1.0; // stretch back to normal
      }

      // Smooth interpolation for juicy cartoon bounce!
      g.scaleY += (g.targetScaleY - g.scaleY) * dt * 10.0;

      if (Math.abs(g.scaleY - oldScaleY) > 0.005) {
        grassChanged = true;
      }
    });

    if (grassChanged) {
      setRenderGrasses(
        grasses.current.map((g) => ({
          id: g.id,
          x: g.position.x,
          z: g.position.z,
          scaleY: g.scaleY,
        }))
      );
    }

    // 5. UPDATE PLAYER SPRITESHEET TEXTURE OFFSETS
    if (playerTexture) {
      // Increment frame
      frameTimer.current += dt;
      let frameDuration = 0.15; // default Walk speed
      if (playerState.current === 'idle') frameDuration = 0.28;
      if (playerState.current === 'attack') frameDuration = 0.08;
      if (playerState.current === 'dance') frameDuration = 0.12;

      if (frameTimer.current >= frameDuration) {
        frameTimer.current = 0;
        animFrame.current = (animFrame.current + 1) % 4; // 4 columns
      }

      const col = animFrame.current;
      // Rows:
      // Row 1: Idle -> V=0.75
      // Row 2: Walk -> V=0.50
      // Row 3: Attack -> V=0.25
      // Row 4: Dance -> V=0.00
      let rowOffset = 0.75;
      if (playerState.current === 'walk') rowOffset = 0.50;
      if (playerState.current === 'attack') rowOffset = 0.25;
      if (playerState.current === 'dance') rowOffset = 0.00;

      playerTexture.offset.set(col * 0.25, rowOffset);
    }

    // Dynamic Player Opacity Animation during damage invulnerability frames
    if (playerMeshRef.current) {
      const mat = playerMeshRef.current.material as THREE.MeshBasicMaterial;
      if (invulnerableTimer.current > 0) {
        mat.opacity = Math.sin(state.clock.elapsedTime * 22) > 0 ? 0.35 : 0.9;
      } else {
        mat.opacity = 1.0;
      }
    }

    // 6. SMOOTH CAMERA FOLLOWING PLAYER
    const targetCamX = playerPos.current.x;
    const targetCamY = playerPos.current.y + 11.5;
    const targetCamZ = playerPos.current.z + 13.5;

    camera.position.x += (targetCamX - camera.position.x) * 0.08;
    camera.position.y += (targetCamY - camera.position.y) * 0.08;
    camera.position.z += (targetCamZ - camera.position.z) * 0.08;
    camera.lookAt(playerPos.current.x, playerPos.current.y + 1.2, playerPos.current.z);
  });

  return (
    <>
      {/* 3D LIGHTING */}
      <ambientLight intensity={1.4} color="#fbf7f0" />
      <directionalLight 
        intensity={1.8} 
        position={[20, 35, 15]} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight 
        position={[playerPos.current.x, 3.5, playerPos.current.z]} 
        intensity={2.5} 
        distance={15} 
        color={settings.character.color} 
      />

      {/* STYLIZED ARENA BORDER LANTERNS / ENCLOSURES */}
      <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        {groundTexture ? (
          <meshStandardMaterial map={groundTexture} roughness={0.8} metalness={0.25} />
        ) : (
          <meshStandardMaterial color="#14532d" roughness={0.9} />
        )}
      </mesh>

      {/* Borders Fence blocks to mark 50x50 perimeter limits */}
      {useMemo(() => {
        const fences = [];
        // Draw lanterns at the borders of the plane
        for (let x = -25; x <= 25; x += 10) {
          fences.push(
            <group key={`fence-n-${x}`} position={[x, 0.5, -25]}>
              <mesh castShadow><boxGeometry args={[0.5, 1.6, 0.5]} /><meshStandardMaterial color="#451a03" /></mesh>
              <mesh position={[0, 0.9, 0]}><sphereGeometry args={[0.4, 8, 8]} /><meshBasicMaterial color="#ef4444" /></mesh>
            </group>
          );
          fences.push(
            <group key={`fence-s-${x}`} position={[x, 0.5, 25]}>
              <mesh castShadow><boxGeometry args={[0.5, 1.6, 0.5]} /><meshStandardMaterial color="#451a03" /></mesh>
              <mesh position={[0, 0.9, 0]}><sphereGeometry args={[0.4, 8, 8]} /><meshBasicMaterial color="#ef4444" /></mesh>
            </group>
          );
        }
        for (let z = -25; z <= 25; z += 10) {
          if (z !== -25 && z !== 25) {
            fences.push(
              <group key={`fence-w-${z}`} position={[-25, 0.5, z]}>
                <mesh castShadow><boxGeometry args={[0.5, 1.6, 0.5]} /><meshStandardMaterial color="#451a03" /></mesh>
                <mesh position={[0, 0.9, 0]}><sphereGeometry args={[0.4, 8, 8]} /><meshBasicMaterial color="#eab308" /></mesh>
              </group>
            );
            fences.push(
              <group key={`fence-e-${z}`} position={[25, 0.5, z]}>
                <mesh castShadow><boxGeometry args={[0.5, 1.6, 0.5]} /><meshStandardMaterial color="#451a03" /></mesh>
                <mesh position={[0, 0.9, 0]}><sphereGeometry args={[0.4, 8, 8]} /><meshBasicMaterial color="#eab308" /></mesh>
              </group>
            );
          }
        }
        return fences;
      }, [])}

      {/* 2D BILLBOARD PLAYER CHARACTER */}
      <Billboard position={[playerPos.current.x, 1.3, playerPos.current.z]} follow={true}>
        <mesh 
          ref={playerMeshRef}
          scale={[playerFacing.current === 'left' ? -1.0 : 1.0, 1.0, 1.0]}
        >
          <planeGeometry args={[2.7, 2.7]} />
          {playerTexture ? (
            <meshBasicMaterial 
              map={playerTexture} 
              transparent={true} 
              alphaTest={0.01} 
              color={settings.character.color} // Apply customized color tinting!
            />
          ) : (
            <meshStandardMaterial color={settings.character.color} />
          )}
        </mesh>
        
        {/* Glow halo indicating invulnerable/charging states */}
        {invulnerableTimer.current > 0 && (
          <mesh position={[0, 0, -0.05]}>
            <planeGeometry args={[3.2, 3.2]} />
            <meshBasicMaterial color="#fbbf24" transparent={true} opacity={0.35} />
          </mesh>
        )}
      </Billboard>

      {/* SWORD SLASH WEAPON sweep 3D effect */}
      {slashEffect.active && (
        <Billboard position={[slashEffect.x, 1.2, slashEffect.z]} follow={true}>
          <mesh scale={[slashEffect.facing === 'left' ? -1.0 : 1.0, 1.0, 1.0]}>
            <planeGeometry args={[3.0, 2.0]} />
            <meshBasicMaterial 
              color="#fbbf24" 
              transparent={true} 
              opacity={0.8} 
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </Billboard>
      )}

      {/* SACRED DANCE MIND MANDALA expanding on the ground */}
      {danceMandala.active && (
        <mesh position={[danceMandala.x, 0.08, danceMandala.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[danceMandala.radius - 0.4, danceMandala.radius, 48]} />
          <meshBasicMaterial color="#ec4899" transparent={true} opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* GHOST ENEMIES (Floating Haunted Masks) */}
      {renderGhosts.map((g) => (
        <Billboard key={g.id} position={[g.x, g.y !== undefined ? g.y : 1.1, g.z]} follow={true}>
          <group>
            {enemyTexture ? (
              <EnemySprite3D
                texture={enemyTexture}
                facing={g.facing}
                isIdle={g.isIdle}
                animFrame={g.animFrame}
                blinkRedTimer={g.blinkRedTimer}
                blinkWhiteTimer={g.blinkWhiteTimer}
                isDead={g.isDead}
              />
            ) : (
              <mesh>
                <planeGeometry args={[2.0, 2.0]} />
                {playerTexture ? (
                  <meshBasicMaterial 
                    map={playerTexture} 
                    transparent={true} 
                    alphaTest={0.02}
                    color="#a855f7" 
                  />
                ) : (
                  <meshBasicMaterial color="#7c3aed" />
                )}
              </mesh>
            )}

            {/* Float Eerie glowing outline sphere */}
            {!g.isDead && (
              <mesh position={[0, 0, -0.05]}>
                <sphereGeometry args={[0.7, 12, 12]} />
                <meshBasicMaterial color={g.blinkRedTimer > 0 ? "#ef4444" : "#6366f1"} transparent opacity={0.3} />
              </mesh>
            )}
          </group>
        </Billboard>
      ))}

      {/* RANDOM GRASS PATCHES */}
      {renderGrasses.map((g) => (
        <Billboard key={`grass-${g.id}`} position={[g.x, 0.2, g.z]} follow={true}>
          <group scale={[1.4, g.scaleY, 1.0]}>
            <mesh position={[0, 0.5, 0]}>
              <planeGeometry args={[1.5, 1.1]} />
              {grassTexture ? (
                <meshBasicMaterial map={grassTexture} transparent={true} alphaTest={0.01} />
              ) : (
                <meshBasicMaterial color="#22c55e" />
              )}
            </mesh>
          </group>
        </Billboard>
      ))}

      {/* WOOD LOGS (Breakable Obstacles) */}
      {renderLogs.map((l) => (
        <group key={l.id} position={[l.x, 0.6 * l.scale, l.z]} scale={[l.scale, l.scale, l.scale]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.5, 0.5, 1.2, 12]} />
            <meshStandardMaterial color="#854d0e" roughness={0.85} />
          </mesh>
          {/* Top tree branch ring */}
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 0.1, 12]} />
            <meshStandardMaterial color="#a16207" />
          </mesh>
        </group>
      ))}

      {/* ITEMS (Floating, Spinning Collectibles) */}
      {renderItems.map((it) => (
        <SpinningItem3D key={it.id} x={it.x} y={it.y} z={it.z} type={it.type} texture={itemTexture} />
      ))}

      {/* 2D BILLBOARD BOSS CHARACTER */}
      {bossTexture && renderBoss && (
        <Billboard position={renderBoss.position} follow={true}>
          <group>
            <BossSprite3D
              texture={bossTexture}
              facing={renderBoss.facing}
              pattern={renderBoss.pattern}
              animFrame={renderBoss.animFrame}
              blinkRedTimer={renderBoss.blinkRedTimer}
              scaleFactor={renderBoss.scaleFactor}
              isDead={renderBoss.isDead}
            />
            {/* Ambient evil glowing aura for boss */}
            {!renderBoss.isDead && (
              <mesh position={[0, 0, -0.1]}>
                <sphereGeometry args={[2.5, 16, 16]} />
                <meshBasicMaterial 
                  color={renderBoss.pattern === 'warning' ? '#dc2626' : '#9333ea'} 
                  transparent 
                  opacity={0.25} 
                />
              </mesh>
            )}
          </group>
        </Billboard>
      )}

      {/* BOSS FIREBALLS & WARNING INDICATORS ON THE GROUND */}
      {renderFireballs.map((fb) => (
        <group key={`fb-grp-${fb.id}`}>
          {/* 3D Warning Circle Decal on Ground (if fireball is high in the sky and falling) */}
          {fb.y > 1.0 && (
            <mesh position={[fb.targetX, 0.08, fb.targetZ]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.2 - 0.1, 1.2, 32]} />
              <meshBasicMaterial color="#ef4444" transparent opacity={0.65} side={THREE.DoubleSide} />
            </mesh>
          )}
          {fb.y > 1.0 && (
            <mesh position={[fb.targetX, 0.08, fb.targetZ]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[1.2, 32]} />
              <meshBasicMaterial color="#ef4444" transparent opacity={0.15 + Math.sin(Date.now() * 0.01) * 0.1} side={THREE.DoubleSide} />
            </mesh>
          )}

          {/* 3D Fireball sphere */}
          {!fb.hit && (
            <mesh position={[fb.x, fb.y, fb.z]}>
              <sphereGeometry args={[0.5, 12, 12]} />
              <meshBasicMaterial color="#f97316" />
            </mesh>
          )}
          {!fb.hit && (
            <mesh position={[fb.x, fb.y, fb.z]}>
              <sphereGeometry args={[0.7, 8, 8]} />
              <meshBasicMaterial color="#ef4444" transparent opacity={0.4} />
            </mesh>
          )}
        </group>
      ))}

      {/* GLOWING WARP PORTAL TO ENDING */}
      {warpPortal && warpPortal.active && (
        <group position={[warpPortal.x, 0.1, warpPortal.z]}>
          {/* Ground decal ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.4, 1.7, 32]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.8} side={THREE.DoubleSide} />
          </mesh>
          {/* Glowing warp column */}
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[1.3, 1.4, 3.0, 32, 1, true]} />
            <meshBasicMaterial 
              color="#e9d5ff" 
              transparent 
              opacity={0.35 + Math.sin(Date.now() * 0.005) * 0.15} 
              side={THREE.DoubleSide} 
            />
          </mesh>
          {/* Inner Core rotating portal */}
          <Billboard position={[0, 1.5, 0]} follow={true}>
            <mesh rotation={[0, 0, Date.now() * 0.002]}>
              <planeGeometry args={[2.5, 2.5]} />
              <meshBasicMaterial color="#a855f7" transparent opacity={0.45} />
            </mesh>
          </Billboard>
        </group>
      )}
    </>
  );
}

// Parent Wrapper rendering ThreeJS WebGL canvas + HTML HUD dashboards
export default function GameCanvas({ settings, onGameOver, onQuit }: GameCanvasProps) {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5); // Start with 5 lives
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [showScoreSaved, setShowScoreSaved] = useState(false);
  const [playerNameInput, setPlayerNameInput] = useState(settings.character.name || 'ผู้กล้าด่านซ้าย');
  const [dashCooldown, setDashCooldown] = useState(0);

  // Loaded texture states
  const [playerTexture, setPlayerTexture] = useState<THREE.Texture | null>(null);
  const [groundTexture, setGroundTexture] = useState<THREE.Texture | null>(null);
  const [itemTexture, setItemTexture] = useState<THREE.Texture | null>(null);
  const [enemyTexture, setEnemyTexture] = useState<THREE.Texture | null>(null);
  const [grassTexture, setGrassTexture] = useState<THREE.Texture | null>(null);
  const [bossTexture, setBossTexture] = useState<THREE.Texture | null>(null);

  // Boss and Ending states
  const [bossHealth, setBossHealth] = useState<number | null>(null);
  const [showEnding, setShowEnding] = useState(false);

  // Spasmodic particles
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; z: number; color: string; size: number }[]>([]);
  const particlesRef = useRef<{ id: number; x: number; y: number; z: number; vx: number; vy: number; vz: number; color: string; size: number; life: number }[]>([]);
  const nextParticleId = useRef(0);

  // Virtual touch controls references
  const virtualInput = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
    attack: false,
    dance: false,
    dash: false,
  });

  // Preload graphics and repeating configurations
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      'https://res.cloudinary.com/dsucg33fv/image/upload/v1782439981/player_mask_fmn9yv.png',
      (tex) => {
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.repeat.set(0.25, 0.25);
        tex.minFilter = THREE.NearestFilter;
        tex.magFilter = THREE.NearestFilter;
        setPlayerTexture(tex);
      }
    );

    loader.load(
      'https://res.cloudinary.com/dpsgekmkg/image/upload/v1782440058/player_mask_a77ezz.png',
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(16, 16); // Tiling repeated smaller
        setGroundTexture(tex);
      }
    );

    loader.load(
      'https://res.cloudinary.com/dsucg33fv/image/upload/v1782439981/item_a371ol.png',
      (tex) => {
        tex.minFilter = THREE.NearestFilter;
        tex.magFilter = THREE.NearestFilter;
        setItemTexture(tex);
      }
    );

    loader.load(
      'https://res.cloudinary.com/dsucg33fv/image/upload/v1782439979/enemy_mp1zhh.png',
      (tex) => {
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.repeat.set(0.25, 0.5); // 4 horizontal frames, 2 vertical rows (standing/idle, walking)
        tex.minFilter = THREE.NearestFilter;
        tex.magFilter = THREE.NearestFilter;
        setEnemyTexture(tex);
      }
    );

    loader.load(
      'https://res.cloudinary.com/dsucg33fv/image/upload/v1782439980/grass_2_kjkske.png',
      (tex) => {
        tex.minFilter = THREE.NearestFilter;
        tex.magFilter = THREE.NearestFilter;
        setGrassTexture(tex);
      }
    );

    loader.load(
      'https://res.cloudinary.com/dsucg33fv/image/upload/v1782439980/boss_pblkge.png',
      (tex) => {
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.repeat.set(0.5, 0.5); // 2 frames per row, 2 rows total
        tex.minFilter = THREE.NearestFilter;
        tex.magFilter = THREE.NearestFilter;
        setBossTexture(tex);
      }
    );

    // Fetch and read local scores
    const saved = localStorage.getItem('dansai_high_scores');
    if (saved) {
      try {
        setHighScores(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }

    audio.startMusic();
    return () => {
      audio.stopMusic();
    };
  }, []);

  // Update particles positions in normal React loop for buttery overlays
  useEffect(() => {
    if (isPaused || gameOver) return;

    const interval = setInterval(() => {
      const dt = 0.033; // 30fps ticks
      particlesRef.current.forEach((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        p.vy -= 9.8 * dt; // Gravity pull down
        p.life -= dt;
      });

      // Filter remaining active particles
      particlesRef.current = particlesRef.current.filter((p) => p.life > 0 && p.y >= 0);

      setParticles(
        particlesRef.current.map((p) => ({
          id: p.id,
          x: p.x,
          y: p.y,
          z: p.z,
          color: p.color,
          size: p.size,
        }))
      );
    }, 33);

    return () => clearInterval(interval);
  }, [isPaused, gameOver]);

  // Helper generator spawning gorgeous 3D explosions
  const handleSpawnParticles = (x: number, y: number, z: number, color: string, count: number) => {
    const newParticles = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      newParticles.push({
        id: nextParticleId.current++,
        x,
        y,
        z,
        vx: Math.cos(angle) * speed,
        vy: 3 + Math.random() * 6,
        vz: Math.sin(angle) * speed,
        color,
        size: 0.14 + Math.random() * 0.22,
        life: 0.45 + Math.random() * 0.45,
      });
    }
    particlesRef.current.push(...newParticles);
  };

  const togglePause = () => {
    audio.playClick();
    setIsPaused((p) => !p);
  };

  const handleRestart = () => {
    audio.playCollect();
    setScore(0);
    setLives(5); // Start with 5 lives upon restarting
    setGameOver(false);
    setIsPaused(false);
    setShowScoreSaved(false);
    setBossHealth(null);
    setShowEnding(false);
    audio.startMusic();
  };

  // Listen to the Escape (ESC) key globally to trigger game pause state toggles
  useEffect(() => {
    const handleGlobalEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!gameOver) {
          togglePause();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalEscape);
    return () => {
      window.removeEventListener('keydown', handleGlobalEscape);
    };
  }, [gameOver]);

  const handleSaveHighScore = () => {
    if (!playerNameInput.trim()) return;
    audio.playCollect();

    const newScore: HighScore = {
      name: playerNameInput,
      score: score,
      date: new Date().toLocaleDateString('th-TH'),
      mask: settings.character.mask,
    };

    const updated = [...highScores, newScore]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    setHighScores(updated);
    localStorage.setItem('dansai_high_scores', JSON.stringify(updated));
    setShowScoreSaved(true);
  };

  // Touch handlers for virtual controllers on mobile screen layout
  const handleVirtualPress = (
    action: 'up' | 'down' | 'left' | 'right' | 'attack' | 'dance' | 'dash',
    pressed: boolean
  ) => {
    virtualInput.current[action] = pressed;
    if (pressed) {
      audio.playClick();
    }
  };

  return (
    <div className="relative flex flex-col w-full h-full text-white bg-black select-none font-kanit">
      
      {/* 1. STATUS BAR HEAD-UP DISPLAY (HUD) */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between bg-black/60 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-zinc-900 z-30">
        <div className="flex items-center gap-4">
          {/* Character visual indicator */}
          <div className="flex items-center gap-2">
            <span 
              className="w-3.5 h-3.5 rounded-full ring-2 ring-black" 
              style={{ backgroundColor: settings.character.color }}
            />
            <span className="font-bold text-sm tracking-wide text-zinc-300">
              {settings.character.name || 'ผู้กล้าด่านซ้าย'}
            </span>
          </div>

          {/* Heart indicators */}
          <div className="flex items-center gap-1.5 bg-zinc-900/85 px-2.5 py-1 rounded-md border border-zinc-850">
            <span className="text-[10px] text-zinc-500 font-bold">LIVES:</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((heart) => (
                <span 
                  key={heart} 
                  className={`text-sm transition-all duration-300 ${
                    heart <= lives ? 'scale-100 opacity-100 filter drop-shadow' : 'scale-75 opacity-10 filter grayscale'
                  }`}
                >
                  👹
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Live Score Counter */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-red-600 to-amber-500 px-4 py-1 rounded-md text-sm font-black tracking-widest text-black shadow-md flex items-center gap-1">
            <span>แต้ม:</span>
            <span className="font-mono">{score}</span>
          </div>

          {/* Pause / Play Control */}
          <button 
            id="btn-pause-toggle"
            onClick={togglePause}
            className="p-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-500" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. THREE.JS 3D CANVAS STAGE VIEWPORT */}
      <div className="flex-1 w-full h-full relative bg-zinc-950 overflow-hidden">
        <Canvas shadows camera={{ position: [0, 11, 14], fov: 45 }}>
          <GameScene3D 
            settings={settings}
            isPaused={isPaused}
            gameOver={gameOver}
            score={score}
            setScore={setScore}
            lives={lives}
            setLives={setLives}
            setGameOver={setGameOver}
            setDashCooldown={setDashCooldown}
            playerTexture={playerTexture}
            groundTexture={groundTexture}
            itemTexture={itemTexture}
            enemyTexture={enemyTexture}
            grassTexture={grassTexture}
            bossTexture={bossTexture}
            setBossHealth={setBossHealth}
            setShowEnding={setShowEnding}
            virtualInput={virtualInput}
            onSpawnParticles={handleSpawnParticles}
          />

          {/* 3D PARTICLE SYSTEMS */}
          {particles.map((p) => (
            <mesh key={p.id} position={[p.x, p.y, p.z]}>
              <boxGeometry args={[p.size, p.size, p.size]} />
              <meshBasicMaterial color={p.color} transparent={true} opacity={0.8} />
            </mesh>
          ))}
        </Canvas>

        {/* DASH COOLDOWN NOTIFIER */}
        <div className="absolute top-16 left-4 z-20 flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded text-xs border border-zinc-900">
          <Zap className={`w-3.5 h-3.5 ${dashCooldown === 0 ? 'text-amber-400 animate-pulse' : 'text-zinc-600'}`} />
          <span className="font-mono font-bold text-[10px]">
            {dashCooldown === 0 ? 'DASH READY' : `COOLDOWN: ${dashCooldown.toFixed(1)}s`}
          </span>
        </div>

        {/* BOSS HEALTH BAR HUD */}
        {bossHealth !== null && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 w-64 md:w-96 z-20 flex flex-col items-center bg-black/80 backdrop-blur px-4 py-2.5 rounded-xl border border-red-500/20 shadow-lg">
            <div className="flex items-center justify-between w-full mb-1 text-[10px] font-black tracking-widest text-red-500 font-kanit">
              <span>พญาปีศาจด่านซ้าย (BOSS)</span>
              <span>HP: {bossHealth} / 10</span>
            </div>
            <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
              <div 
                className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 transition-all duration-300 rounded-full"
                style={{ width: `${(bossHealth / 10) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* PAUSED GAME STATE OVERLAY */}
        {isPaused && !gameOver && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-40">
            <div className="max-w-xs w-full bg-zinc-950 border border-zinc-900 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
              <h2 className="text-2xl font-extrabold text-amber-500 font-kanit">เกมหยุดชั่วคราว</h2>
              <p className="text-xs text-zinc-400 font-sans">พร้อมเดินทางต่อแล้วหรือไม่?</p>
              <button
                id="btn-resume-game"
                onClick={togglePause}
                className="w-full py-2 bg-gradient-to-r from-red-600 to-amber-500 rounded-xl text-sm font-bold text-black"
              >
                เล่นต่อทันที
              </button>
            </div>
          </div>
        )}

        {/* GAME OVER SCREEN OVERLAY */}
        {gameOver && !showEnding && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-40">
            <div className="max-w-md w-full bg-zinc-950 border border-zinc-900 rounded-2xl p-6 text-center space-y-5 shadow-[0_0_50px_rgba(239,68,68,0.25)] animate-fade-in">
              <div className="text-5xl">💀</div>
              <h1 className="text-3xl font-extrabold text-red-600 tracking-wider font-kanit">
                จบการเดินทาง!
              </h1>
              <p className="text-sm text-zinc-400 font-kanit">
                คุณฝ่ากองทัพภูติผีและทำลายอุปสรรคในด่านซ้ายได้อย่างน่ายกย่อง
              </p>

              <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 space-y-1">
                <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest block font-sans">คะแนนสุดท้ายของคุณ</span>
                <span className="text-4xl font-black text-amber-500 font-mono tracking-wider">{score}</span>
              </div>

              {/* High Score Save Form */}
              {!showScoreSaved ? (
                <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-900 space-y-2 text-left">
                  <label className="text-xs text-zinc-400 block font-medium">บันทึกสถิติลงกระดานเกียรติยศ:</label>
                  <div className="flex gap-2">
                    <input 
                      id="input-gameover-name"
                      type="text"
                      maxLength={12}
                      value={playerNameInput}
                      onChange={(e) => setPlayerNameInput(e.target.value)}
                      placeholder="กรอกชื่อของคุณ"
                      className="flex-1 bg-black border border-zinc-800 rounded px-3 py-1.5 text-sm text-white font-sans outline-none focus:border-red-500"
                    />
                    <button
                      id="btn-save-highscore"
                      onClick={handleSaveHighScore}
                      className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-xs"
                    >
                      บันทึกสถิติ
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-950/40 border border-emerald-900 p-3 rounded-xl text-xs text-emerald-400 font-medium">
                  ✓ บันทึกคะแนนลงในกระดานเรียบร้อยแล้ว!
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center pt-2">
                <button
                  id="btn-quit-game"
                  onClick={onQuit}
                  className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-xs text-zinc-400 hover:text-white transition-colors font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>ออกไปหน้าแรก</span>
                </button>
                <button
                  id="btn-restart-game"
                  onClick={handleRestart}
                  className="flex-1 flex items-center justify-center gap-1.5 px-6 py-2 bg-gradient-to-r from-red-600 to-amber-500 rounded-xl text-xs font-bold text-black hover:brightness-110 shadow-lg"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>เริ่มใหม่อีกครั้ง</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VICTORY ENDING SCREEN OVERLAY */}
        {showEnding && (
          <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-zinc-900 flex flex-col items-center justify-center p-4 z-45 overflow-y-auto">
            <div className="max-w-md w-full bg-zinc-950/90 border border-amber-500/30 rounded-2xl p-6 text-center space-y-5 shadow-[0_0_60px_rgba(245,158,11,0.2)] animate-fade-in my-auto">
              <div className="text-6xl animate-pulse">✨🎭✨</div>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-300 tracking-wider font-kanit">
                ด่านซ้ายสงบสุขแล้ว!
              </h1>
              <p className="text-sm text-zinc-300 font-kanit leading-relaxed">
                ยอดเยี่ยมมาก! คุณได้ทำลายพญาปีศาจด่านซ้าย และร่ายรำนำความสิริมงคลความร่มเย็นกลับคืนสู่ผืนแผ่นดินสำเร็จ... ประตู Warp ได้พากลับบ้านอย่างปลอดภัย
              </p>

              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-5 rounded-xl border border-amber-500/20 space-y-1">
                <span className="text-xs text-amber-400 font-bold uppercase tracking-widest block font-sans">คะแนนสุดท้ายของมหาผู้กล้า</span>
                <span className="text-5xl font-black text-amber-400 font-mono tracking-wider">{score}</span>
              </div>

              {/* High Score Save Form */}
              {!showScoreSaved ? (
                <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 space-y-2 text-left">
                  <label className="text-xs text-amber-300 block font-medium">บันทึกสถิติมหาผู้กล้าลงกระดานเกียรติยศ:</label>
                  <div className="flex gap-2">
                    <input 
                      id="input-victory-name"
                      type="text"
                      maxLength={12}
                      value={playerNameInput}
                      onChange={(e) => setPlayerNameInput(e.target.value)}
                      placeholder="กรอกชื่อของคุณ"
                      className="flex-1 bg-black border border-zinc-800 rounded px-3 py-1.5 text-sm text-white font-sans outline-none focus:border-amber-500"
                    />
                    <button
                      id="btn-victory-save-highscore"
                      onClick={handleSaveHighScore}
                      className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-black font-black rounded text-xs transition-all"
                    >
                      บันทึกสถิติ
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-950/40 border border-emerald-900 p-3 rounded-xl text-xs text-emerald-400 font-medium">
                  ✓ บันทึกคะแนนลงในกระดานเรียบร้อยแล้ว!
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center pt-2">
                <button
                  id="btn-victory-quit"
                  onClick={onQuit}
                  className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-xs text-zinc-400 hover:text-white transition-colors font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>ออกไปหน้าแรก</span>
                </button>
                <button
                  id="btn-victory-restart"
                  onClick={handleRestart}
                  className="flex-1 flex items-center justify-center gap-1.5 px-6 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-xl text-xs font-black text-black hover:brightness-110 shadow-lg"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>เริ่มใหม่อีกครั้ง</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. COMFORTABLE VIRTUAL TOUCH PAD MOBILE OVERLAYS */}
      {settings.virtualButtons.enabled && !gameOver && (
        <div 
          className="px-6 py-4 bg-zinc-950 border-t border-zinc-900 select-none z-20 flex justify-between items-center w-full"
          style={{ opacity: settings.virtualButtons.opacity }}
        >
          {/* DIRECTIONAL D-PAD CONTROLLER CROSS */}
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Up Button */}
            <button
              id="vbtn-up"
              onMouseDown={() => handleVirtualPress('up', true)}
              onMouseUp={() => handleVirtualPress('up', false)}
              onMouseLeave={() => handleVirtualPress('up', false)}
              onTouchStart={(e) => { e.preventDefault(); handleVirtualPress('up', true); }}
              onTouchEnd={(e) => { e.preventDefault(); handleVirtualPress('up', false); }}
              className="absolute top-0 w-9 h-9 bg-zinc-900 hover:bg-zinc-850 active:bg-red-950 border border-zinc-800 text-zinc-300 rounded-lg flex items-center justify-center shadow-md touch-none"
            >
              <ChevronUp className="w-5 h-5" />
            </button>

            {/* Down Button */}
            <button
              id="vbtn-down"
              onMouseDown={() => handleVirtualPress('down', true)}
              onMouseUp={() => handleVirtualPress('down', false)}
              onMouseLeave={() => handleVirtualPress('down', false)}
              onTouchStart={(e) => { e.preventDefault(); handleVirtualPress('down', true); }}
              onTouchEnd={(e) => { e.preventDefault(); handleVirtualPress('down', false); }}
              className="absolute bottom-0 w-9 h-9 bg-zinc-900 hover:bg-zinc-850 active:bg-red-950 border border-zinc-800 text-zinc-300 rounded-lg flex items-center justify-center shadow-md touch-none"
            >
              <ChevronDown className="w-5 h-5" />
            </button>

            {/* Left Button */}
            <button
              id="vbtn-left"
              onMouseDown={() => handleVirtualPress('left', true)}
              onMouseUp={() => handleVirtualPress('left', false)}
              onMouseLeave={() => handleVirtualPress('left', false)}
              onTouchStart={(e) => { e.preventDefault(); handleVirtualPress('left', true); }}
              onTouchEnd={(e) => { e.preventDefault(); handleVirtualPress('left', false); }}
              className="absolute left-0 w-9 h-9 bg-zinc-900 hover:bg-zinc-850 active:bg-red-950 border border-zinc-800 text-zinc-300 rounded-lg flex items-center justify-center shadow-md touch-none"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Right Button */}
            <button
              id="vbtn-right"
              onMouseDown={() => handleVirtualPress('right', true)}
              onMouseUp={() => handleVirtualPress('right', false)}
              onMouseLeave={() => handleVirtualPress('right', false)}
              onTouchStart={(e) => { e.preventDefault(); handleVirtualPress('right', true); }}
              onTouchEnd={(e) => { e.preventDefault(); handleVirtualPress('right', false); }}
              className="absolute right-0 w-9 h-9 bg-zinc-900 hover:bg-zinc-850 active:bg-red-950 border border-zinc-800 text-zinc-300 rounded-lg flex items-center justify-center shadow-md touch-none"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Center Core Decor */}
            <div className="w-8 h-8 bg-zinc-950 rounded-full border border-zinc-900/60" />
          </div>

          {/* KEYBOARD QUICK GUIDE (HIDDEN ON MOBILE VIEWPORTS) */}
          <div className="hidden md:flex flex-col items-center text-[10px] text-zinc-500 font-mono gap-1">
            <span className="flex items-center gap-1">
              <Keyboard className="w-3.5 h-3.5 text-red-500" />
              <span>ใช้คีย์บอร์ดนำทาง:</span>
            </span>
            <span className="bg-zinc-900 px-2 py-0.5 rounded text-zinc-400 border border-zinc-850">
              WASD / ARROW KEYS = เดิน 8 ทิศทาง
            </span>
            <span className="bg-zinc-900 px-2 py-0.5 rounded text-zinc-400 border border-zinc-850">
              P = ต่อยหรือโจมตี (ROW 3) | O = ระบำสร้างอาณาเขตฮีล (ROW 4) | SHIFT = แดชพุ่งตัว
            </span>
          </div>

          {/* SKILL / ACTION BUTTONS */}
          <div className="flex gap-2 items-center">
            {/* P -> Attack Skill Button */}
            <button
              id="vbtn-attack"
              onMouseDown={() => handleVirtualPress('attack', true)}
              onMouseUp={() => handleVirtualPress('attack', false)}
              onMouseLeave={() => handleVirtualPress('attack', false)}
              onTouchStart={(e) => { e.preventDefault(); handleVirtualPress('attack', true); }}
              onTouchEnd={(e) => { e.preventDefault(); handleVirtualPress('attack', false); }}
              className="flex flex-col items-center justify-center bg-red-600 hover:bg-red-500 active:bg-red-800 border border-red-500 text-white rounded-xl shadow-lg w-13 h-13 touch-none"
              title="ต่อยหรือโจมตี (P)"
            >
              <Swords className="w-5 h-5" />
              <span className="text-[8px] font-bold font-mono tracking-tighter block mt-0.5">P / ATTACK</span>
            </button>

            {/* O -> Sacred Dance Skill Button */}
            <button
              id="vbtn-dance"
              onMouseDown={() => handleVirtualPress('dance', true)}
              onMouseUp={() => handleVirtualPress('dance', false)}
              onMouseLeave={() => handleVirtualPress('dance', false)}
              onTouchStart={(e) => { e.preventDefault(); handleVirtualPress('dance', true); }}
              onTouchEnd={(e) => { e.preventDefault(); handleVirtualPress('dance', false); }}
              className="flex flex-col items-center justify-center bg-purple-600 hover:bg-purple-500 active:bg-purple-800 border border-purple-500 text-white rounded-xl shadow-lg w-13 h-13 touch-none"
              title="ระบำสะเดาะเคราะห์ (O)"
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-[8px] font-bold font-mono tracking-tighter block mt-0.5">O / DANCE</span>
            </button>

            {/* DASH SKILL BUTTON */}
            <button
              id="vbtn-dash"
              onMouseDown={() => handleVirtualPress('dash', true)}
              onMouseUp={() => handleVirtualPress('dash', false)}
              onMouseLeave={() => handleVirtualPress('dash', false)}
              onTouchStart={(e) => { e.preventDefault(); handleVirtualPress('dash', true); }}
              onTouchEnd={(e) => { e.preventDefault(); handleVirtualPress('dash', false); }}
              className="flex flex-col items-center justify-center bg-zinc-900 border border-zinc-800 text-amber-500 rounded-xl shadow-lg w-13 h-13 touch-none active:bg-zinc-800"
              title="พุ่งตัว (SHIFT)"
            >
              <Zap className="w-5 h-5" />
              <span className="text-[8px] font-bold font-mono tracking-tighter block mt-0.5">SHIFT / DASH</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
