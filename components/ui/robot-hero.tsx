"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { PiSparkleFill } from "react-icons/pi";
import Link from "next/link";

// ─── Robot Emotion Presets (Inspired by Spline r4xbot) ───────────────────────

export type RobotEmotion = "friendly" | "loved" | "curious" | "cool" | "excited";

export interface EmotionConfig {
  name: string;
  label: string;
  pantallaColor: string;
  pantallaBrillo: number;
  isLoved: boolean;
  eyeScale: number;
  tiltMultiplier: number;
  glowColor: string;
}

export const ROBOT_EMOTIONS: Record<RobotEmotion, EmotionConfig> = {
  friendly: {
    name: "friendly",
    label: "Friendly",
    pantallaColor: "#00ffc6",
    pantallaBrillo: 1.25,
    isLoved: false,
    eyeScale: 1.1,
    tiltMultiplier: 1.0,
    glowColor: "#00ffc6",
  },
  loved: {
    name: "loved",
    label: "Loved",
    pantallaColor: "#ff2d75",
    pantallaBrillo: 1.6,
    isLoved: true,
    eyeScale: 1.25,
    tiltMultiplier: 1.2,
    glowColor: "#ff2d75",
  },
  curious: {
    name: "curious",
    label: "Thinking",
    pantallaColor: "#ffb703",
    pantallaBrillo: 1.35,
    isLoved: false,
    eyeScale: 1.05,
    tiltMultiplier: 1.4,
    glowColor: "#ffb703",
  },
  cool: {
    name: "cool",
    label: "Focused",
    pantallaColor: "#00b4d8",
    pantallaBrillo: 1.2,
    isLoved: false,
    eyeScale: 1.15,
    tiltMultiplier: 0.9,
    glowColor: "#00b4d8",
  },
  excited: {
    name: "excited",
    label: "Excited",
    pantallaColor: "#a855f7",
    pantallaBrillo: 1.5,
    isLoved: false,
    eyeScale: 1.2,
    tiltMultiplier: 1.3,
    glowColor: "#a855f7",
  },
};

// ─── Heart Curve for Love Eyes ──────────────────────────────────────────────

class HeartCurve extends THREE.Curve<THREE.Vector3> {
  constructor() {
    super();
  }
  getPoint(t: number, optionalTarget = new THREE.Vector3()) {
    t = t * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);

    return optionalTarget.set(x * 0.002, (y + 6) * 0.002, 0);
  }
}

const sharedHeartCurve = new HeartCurve();

function ResponsiveGroup({
  children,
  scale = 1,
}: {
  children: React.ReactNode;
  scale?: number;
}) {
  const { viewport } = useThree();
  const s = Math.min(1.1, viewport.width / 3.5) * scale;
  return <group scale={s}>{children}</group>;
}

function GlassCapsule({
  color,
  power,
  intensity,
}: {
  color: string;
  power: number;
  intensity: number;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      color: { value: new THREE.Color("#ffffff") },
      power: { value: 2.5 },
      intensity: { value: 0.6 },
    }),
    [],
  );

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.color.value.set(color);
      materialRef.current.uniforms.power.value = power;
      materialRef.current.uniforms.intensity.value = intensity;
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[0.3, 64, 64, 0, Math.PI * 2, 0, Math.PI]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          uniform vec3 color;
          uniform float power;
          uniform float intensity;
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          void main() {
            vec3 normal = normalize(vNormal);
            vec3 viewDir = normalize(vViewPosition);
            float fresnel = 1.0 - max(dot(viewDir, normal), 0.0);
            fresnel = pow(fresnel, power);
            gl_FragColor = vec4(color, fresnel * intensity);
          }
        `}
        transparent={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

const earBaseMat = new THREE.MeshStandardMaterial({
  color: "#f0f0f0",
  roughness: 0.5,
});
const earRingMat = new THREE.MeshStandardMaterial({
  color: "#ffffff",
  roughness: 0.3,
});
const earCenterMat = new THREE.MeshStandardMaterial({
  color: "#cccccc",
  roughness: 0.8,
});
const antennaBaseMat = new THREE.MeshStandardMaterial({
  color: "#999999",
  roughness: 0.4,
  metalness: 0.5,
});
const antennaStickMat = new THREE.MeshStandardMaterial({
  color: "#d0d0d0",
  roughness: 0.4,
  metalness: 0.2,
});
const antennaTipMat = new THREE.MeshStandardMaterial({
  color: "#ff3366",
  roughness: 0.2,
  toneMapped: false,
});

function RobotEar({
  position,
  scale = 1,
  isLeft = false,
}: {
  position: [number, number, number];
  scale?: number;
  isLeft?: boolean;
}) {
  const dir = isLeft ? -1 : 1;

  return (
    <group position={position} scale={scale}>
      <mesh
        rotation={[0, 0, Math.PI / 2]}
        castShadow
        receiveShadow
        material={earBaseMat}
      >
        <cylinderGeometry args={[0.04, 0.04, 0.025, 32]} />
      </mesh>

      <mesh
        position={[dir * 0.012, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
        receiveShadow
        material={earRingMat}
      >
        <torusGeometry args={[0.032, 0.008, 16, 32]} />
      </mesh>

      <mesh
        position={[dir * 0.012, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
        receiveShadow
        material={earCenterMat}
      >
        <cylinderGeometry args={[0.03, 0.03, 0.005, 32]} />
      </mesh>

      <group position={[dir * 0.015, 0.035, 0]} rotation={[-0.4, 0, 0]}>
        <mesh
          position={[0, 0.01, 0]}
          castShadow
          receiveShadow
          material={antennaBaseMat}
        >
          <cylinderGeometry args={[0.006, 0.008, 0.02, 16]} />
        </mesh>
        <mesh
          position={[0, 0.06, 0]}
          castShadow
          receiveShadow
          material={antennaStickMat}
        >
          <cylinderGeometry args={[0.003, 0.003, 0.1, 8]} />
        </mesh>
        <mesh
          position={[0, 0.11, 0]}
          castShadow
          receiveShadow
          material={antennaTipMat}
        >
          <sphereGeometry args={[0.006, 16, 16]} />
        </mesh>
      </group>
    </group>
  );
}

const eyeMat = new THREE.MeshBasicMaterial({
  color: new THREE.Color(2, 2, 2),
  toneMapped: false,
  transparent: true,
});
const heartMat = new THREE.MeshBasicMaterial({
  color: "#ff3366",
  toneMapped: false,
});

function RobotEye({
  position,
  rotation,
  scale = 1,
  blinkDuration = 0.15,
  blinkCycle = 3.0,
  isLovedRef,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: number;
  blinkDuration?: number;
  blinkCycle?: number;
  isLovedRef: React.MutableRefObject<boolean>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const normalEyesRef = useRef<THREE.Group>(null);
  const heartEyeRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current || !normalEyesRef.current || !heartEyeRef.current)
      return;

    const isHeart = isLovedRef.current;

    normalEyesRef.current.visible = !isHeart;
    heartEyeRef.current.visible = isHeart;

    const cycle = clock.getElapsedTime() % blinkCycle;

    let targetScaleY = 1;

    if (cycle < blinkDuration && !isHeart) {
      const progress = cycle / blinkDuration;
      const blinkClose = Math.sin(progress * Math.PI);

      targetScaleY = Math.max(0.05, 1.0 - blinkClose);
    }

    groupRef.current.scale.set(scale, scale * targetScaleY, scale);
  });

  const { topPath, bottomPath } = useMemo(() => {
    const w = 0.025;
    const h = 0.035;
    const r = 0.02;
    const g = 0.005;

    const tPath = new THREE.CurvePath<THREE.Vector3>();
    tPath.add(
      new THREE.LineCurve3(
        new THREE.Vector3(-w, g, 0),
        new THREE.Vector3(-w, h - r, 0),
      ),
    );
    tPath.add(
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-w, h - r, 0),
        new THREE.Vector3(-w, h, 0),
        new THREE.Vector3(-w + r, h, 0),
      ),
    );
    tPath.add(
      new THREE.LineCurve3(
        new THREE.Vector3(-w + r, h, 0),
        new THREE.Vector3(w - r, h, 0),
      ),
    );
    tPath.add(
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(w - r, h, 0),
        new THREE.Vector3(w, h, 0),
        new THREE.Vector3(w, h - r, 0),
      ),
    );
    tPath.add(
      new THREE.LineCurve3(
        new THREE.Vector3(w, h - r, 0),
        new THREE.Vector3(w, g, 0),
      ),
    );

    const bPath = new THREE.CurvePath<THREE.Vector3>();
    bPath.add(
      new THREE.LineCurve3(
        new THREE.Vector3(-w, -g, 0),
        new THREE.Vector3(-w, -(h - r), 0),
      ),
    );
    bPath.add(
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-w, -(h - r), 0),
        new THREE.Vector3(-w, -h, 0),
        new THREE.Vector3(-w + r, -h, 0),
      ),
    );
    bPath.add(
      new THREE.LineCurve3(
        new THREE.Vector3(-w + r, -h, 0),
        new THREE.Vector3(w - r, -h, 0),
      ),
    );
    bPath.add(
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(w - r, -h, 0),
        new THREE.Vector3(w, -h, 0),
        new THREE.Vector3(w, -(h - r), 0),
      ),
    );
    bPath.add(
      new THREE.LineCurve3(
        new THREE.Vector3(w, -(h - r), 0),
        new THREE.Vector3(w, -g, 0),
      ),
    );

    return { topPath: tPath, bottomPath: bPath };
  }, []);

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <mesh ref={heartEyeRef} visible={false} material={heartMat}>
        <tubeGeometry args={[sharedHeartCurve, 64, 0.0035, 8, true]} />
      </mesh>

      <group ref={normalEyesRef}>
        <mesh material={eyeMat}>
          <tubeGeometry args={[topPath, 20, 0.0035, 8, false]} />
        </mesh>
        <mesh material={eyeMat}>
          <tubeGeometry args={[bottomPath, 20, 0.0035, 8, false]} />
        </mesh>
      </group>
    </group>
  );
}

function generatePbrTexturesAsync(): Promise<{
  colorMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
}> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const size = 512;
      const canvasC = document.createElement("canvas");
      const canvasB = document.createElement("canvas");
      canvasC.width = canvasB.width = size;
      canvasC.height = canvasB.height = size;
      const ctxC = canvasC.getContext("2d");
      const ctxB = canvasB.getContext("2d");

      if (ctxC && ctxB) {
        ctxC.fillStyle = "#dcdcdc";
        ctxC.fillRect(0, 0, size, size);
        ctxB.fillStyle = "#808080";
        ctxB.fillRect(0, 0, size, size);

        for (let i = 0; i < 10000; i++) {
          const x = Math.random() * size;
          const y = Math.random() * size;
          const r = 0.5 + Math.random() * 1.5;
          const isDark = Math.random() > 0.15;

          ctxC.beginPath();
          ctxC.arc(x, y, r, 0, Math.PI * 2);
          ctxC.fillStyle = isDark ? "#222222" : "#dddddd";
          ctxC.fill();

          ctxB.beginPath();
          ctxB.arc(x, y, r, 0, Math.PI * 2);
          ctxB.fillStyle = isDark ? "#000000" : "#ffffff";
          ctxB.fill();
        }
      }

      const texC = new THREE.CanvasTexture(canvasC);
      const texB = new THREE.CanvasTexture(canvasB);
      texC.wrapS = texB.wrapS = THREE.RepeatWrapping;
      texC.wrapT = texB.wrapT = THREE.RepeatWrapping;

      texC.repeat.set(6, 3);
      texB.repeat.set(6, 3);
      texC.needsUpdate = true;
      texB.needsUpdate = true;

      resolve({ colorMap: texC, bumpMap: texB });
    }, 0);
  });
}

function RobotPrototype({
  neckParams = {
    baseR: 0.25,
    baseH: -0.01,
    midR: 0.23,
    midH: 0.02,
    lipBottomR: 0.27,
    lipBottomH: 0.025,
    lipTopR: 0.28,
    lipTopH: 0.05,
    innerR: 0.24,
    innerDropH: 0.03,
  },
  bodyParams = { bodyBevelR: 0.21, bodyBevelY: 0.38, bodyBevelT: 0.015 },
  color = "#c4c4c4",
  pantallaColor = "#00ffc6",
  pantallaBrillo = 1.2,
  blinkCycle = 3.0,
  metalness = 0.0,
  onEmotionTrigger,
  isLovedActive = false,
}: {
  neckParams?: Record<string, number>;
  bodyParams?: Record<string, number>;
  color?: string;
  pantallaColor?: string;
  pantallaBrillo?: number;
  blinkCycle?: number;
  metalness?: number;
  onEmotionTrigger?: () => void;
  isLovedActive?: boolean;
}) {
  const isLovedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  // Sync external love state or internal state
  useEffect(() => {
    isLovedRef.current = isLovedActive;
  }, [isLovedActive]);

  const [textures, setTextures] = useState<{
    colorMap: THREE.CanvasTexture | null;
    bumpMap: THREE.CanvasTexture | null;
  }>({ colorMap: null, bumpMap: null });

  const design = {
    pantallaColor: pantallaColor,
    pantallaGrosor: 3.8,
    pantallaBrillo: pantallaBrillo,
    separacionOjos: 0.07,
    tamañoOrejas: 1.3,
    escalaOjos: 1.1,
    parpadeoFrecuencia: blinkCycle,
    parpadeoDuracion: 0.45,
    colorChasis: color,
    alturaCabeza: 0.6,
  };

  const config = {
    moveSpeed: 0.35,
    bodyRotSpeed: 10.0,
    headRotSpeed: 20.0,
    bodyTiltX: 0.0,
    bodyTiltY: 0.95,
    headLookX: 0.3,
    headLookY: 1.8,
  };

  useFrame((state, delta) => {
    if (!bodyRef.current || !headRef.current) return;

    const dt = Math.min(delta, 0.1);

    const tx = state.pointer.x;
    const ty = state.pointer.y;

    const maxMoveX = state.viewport.width / 3.5;
    const targetPosX = tx * maxMoveX;
    bodyRef.current.position.x = THREE.MathUtils.lerp(
      bodyRef.current.position.x,
      targetPosX,
      config.moveSpeed * dt,
    );

    const relativeX = tx - bodyRef.current.position.x / 2.5;

    const bodyTargetRotY = -relativeX * config.bodyTiltY;
    const bodyTargetRotX = relativeX * relativeX * config.bodyTiltX - ty * 0.25;
    const bodyTargetRotZ = -relativeX * 0.15;

    bodyRef.current.rotation.y = THREE.MathUtils.lerp(
      bodyRef.current.rotation.y,
      bodyTargetRotY,
      config.bodyRotSpeed * dt,
    );
    bodyRef.current.rotation.x = THREE.MathUtils.lerp(
      bodyRef.current.rotation.x,
      bodyTargetRotX,
      config.bodyRotSpeed * dt,
    );
    bodyRef.current.rotation.z = THREE.MathUtils.lerp(
      bodyRef.current.rotation.z,
      bodyTargetRotZ,
      config.bodyRotSpeed * dt,
    );

    const headTargetRotY = relativeX * config.headLookY;
    const headTargetRotX = -ty * config.headLookX;

    headRef.current.rotation.y = THREE.MathUtils.lerp(
      headRef.current.rotation.y,
      headTargetRotY,
      config.headRotSpeed * dt,
    );
    headRef.current.rotation.x = THREE.MathUtils.lerp(
      headRef.current.rotation.x,
      headTargetRotX,
      config.headRotSpeed * dt,
    );
  });

  useEffect(() => {
    let mounted = true;
    let generatedMaps: {
      colorMap: THREE.CanvasTexture;
      bumpMap: THREE.CanvasTexture;
    } | null = null;

    generatePbrTexturesAsync().then((res) => {
      if (mounted) {
        generatedMaps = res;
        setTextures(res);
      } else {
        res.colorMap.dispose();
        res.bumpMap.dispose();
      }
    });

    return () => {
      mounted = false;

      if (generatedMaps) {
        generatedMaps.colorMap.dispose();
        generatedMaps.bumpMap.dispose();
      }
    };
  }, []);

  const handlePointerDown = (
    e: import("@react-three/fiber").ThreeEvent<PointerEvent>,
  ) => {
    e.stopPropagation();
    isLovedRef.current = true;
    if (onEmotionTrigger) {
      onEmotionTrigger();
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (!isLovedActive) {
        isLovedRef.current = false;
      }
    }, 2500);
  };

  const neckProfile = useMemo(() => {
    const points = [];

    points.push(new THREE.Vector2(neckParams.innerR, neckParams.baseH));
    points.push(new THREE.Vector2(neckParams.baseR, neckParams.baseH));
    points.push(new THREE.Vector2(neckParams.midR, neckParams.midH));
    points.push(
      new THREE.Vector2(neckParams.lipBottomR, neckParams.lipBottomH),
    );
    points.push(new THREE.Vector2(neckParams.lipTopR, neckParams.lipTopH));
    points.push(new THREE.Vector2(neckParams.innerR, neckParams.lipTopH));
    points.push(
      new THREE.Vector2(
        neckParams.innerR,
        neckParams.lipTopH - neckParams.innerDropH,
      ),
    );
    return points;
  }, [neckParams]);

  const headMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#111111",
      roughness: 1.0,
      metalness: 0.0,
    });
  }, []);

  if (!textures.colorMap) return null;

  return (
    <group
      ref={bodyRef}
      position={[0, -0.3, 0]}
      onPointerDown={handlePointerDown}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "auto")}
    >
      <mesh castShadow receiveShadow>
        <sphereGeometry
          args={[0.43, 64, 64, 0, Math.PI * 2, Math.PI * 0.15, Math.PI * 0.85]}
        />
        <meshStandardMaterial
          color={design.colorChasis}
          map={textures.colorMap || undefined}
          bumpMap={textures.bumpMap || undefined}
          bumpScale={0.005}
          roughness={1.0}
          metalness={metalness}
          envMapIntensity={0.0}
        />
      </mesh>

      {bodyParams.bodyBevelT > 0 && (
        <mesh
          position={[0, bodyParams.bodyBevelY, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
          receiveShadow
        >
          <torusGeometry
            args={[bodyParams.bodyBevelR, bodyParams.bodyBevelT, 32, 64]}
          />
          <meshStandardMaterial
            color={design.colorChasis}
            map={textures.colorMap || undefined}
            bumpMap={textures.bumpMap || undefined}
            bumpScale={0.005}
            roughness={1.0}
            metalness={metalness}
            envMapIntensity={0.0}
          />
        </mesh>
      )}

      <mesh position={[0, 0.38, 0]} receiveShadow castShadow>
        <latheGeometry args={[neckProfile, 64]} />
        <meshStandardMaterial
          color={design.colorChasis}
          map={textures.colorMap || undefined}
          bumpMap={textures.bumpMap || undefined}
          bumpScale={0.005}
          roughness={1.0}
          metalness={metalness}
          envMapIntensity={0.0}
        />
      </mesh>

      <group ref={headRef} position={[0, design.alturaCabeza, 0]}>
        <mesh material={headMat} castShadow receiveShadow>
          <sphereGeometry args={[0.28, 64, 64, 0, Math.PI * 2, 0, Math.PI]} />
        </mesh>

        <GlassCapsule
          color={design.pantallaColor}
          power={design.pantallaGrosor}
          intensity={design.pantallaBrillo}
        />

        <group position={[0, -0.02, 0.29]}>
          <RobotEye
            position={[-design.separacionOjos, 0, 0]}
            rotation={[0, -0.2, 0]}
            scale={design.escalaOjos}
            blinkDuration={design.parpadeoDuracion}
            blinkCycle={design.parpadeoFrecuencia}
            isLovedRef={isLovedRef}
          />
          <RobotEye
            position={[design.separacionOjos, 0, 0]}
            rotation={[0, 0.2, 0]}
            scale={design.escalaOjos}
            blinkDuration={design.parpadeoDuracion}
            blinkCycle={design.parpadeoFrecuencia}
            isLovedRef={isLovedRef}
          />
        </group>

        <RobotEar
          position={[-0.29, 0, 0]}
          isLeft={true}
          scale={design.tamañoOrejas}
        />
        <RobotEar
          position={[0.29, 0, 0]}
          isLeft={false}
          scale={design.tamañoOrejas}
        />
      </group>
    </group>
  );
}

export interface NavItem {
  label: string;
  href: string;
  target?: string;
}

export interface RobotHeroProps {
  backgroundText?: string;
  navItemsLeft?: NavItem[];
  contactText?: string;
  contactHref?: string;
  contactTarget?: string;
  ctaText?: string;
  onCtaClick?: () => void;
  color?: string;
  scale?: number;
  pantallaColor?: string;
  pantallaBrillo?: number;
  blinkCycle?: number;
  metalness?: number;
  initialEmotion?: RobotEmotion;
  showEmotionPills?: boolean;
}

export function RobotHero({
  backgroundText = "INTUIPREP",
  ctaText = "Start Interview",
  color = "#c4c4c4",
  scale = 1,
  pantallaColor,
  pantallaBrillo,
  blinkCycle = 3.0,
  metalness = 0.0,
  initialEmotion = "friendly",
  showEmotionPills = true,
}: RobotHeroProps = {}) {
  const containerRef = useRef<HTMLElement>(null);
  const [currentEmotionKey, setCurrentEmotionKey] = useState<RobotEmotion>(initialEmotion);

  const activeEmotion = ROBOT_EMOTIONS[currentEmotionKey];
  const effectivePantallaColor = pantallaColor || activeEmotion.pantallaColor;
  const effectivePantallaBrillo = pantallaBrillo || activeEmotion.pantallaBrillo;

  const cycleEmotion = () => {
    const keys: RobotEmotion[] = ["friendly", "loved", "curious", "cool", "excited"];
    const currentIndex = keys.indexOf(currentEmotionKey);
    const nextKey = keys[(currentIndex + 1) % keys.length];
    setCurrentEmotionKey(nextKey);
  };

  const entorno = {
    fondoArriba: "#0d0f14",
    fondoMedio: "#151821",
    fondoAbajo: "#08090c",
    luzAmbiente: 0.85,
    luzPrincipal: 1.0,
    luzPrincipalColor: effectivePantallaColor,
    luzRelleno: 0.5,
    luzRellenoColor: "#38bdf8",
    sombraOpacidad: 0.9,
    sombraBlur: 2.0,
  };

  return (
    <section
      ref={containerRef}
      className="relative w-full h-[85vh] min-h-[640px] max-h-[920px] overflow-hidden rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
      style={{
        background: `radial-gradient(ellipse at 50% 30%, ${entorno.fondoMedio} 0%, ${entorno.fondoArriba} 65%, ${entorno.fondoAbajo} 100%)`,
      }}
    >
      {/* Background Big Typography */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
        style={{ zIndex: 0 }}
      >
        <h1
          className="font-sans font-black select-none whitespace-nowrap"
          style={{
            color: "#ffffff",
            opacity: 0.04,
            letterSpacing: "-0.05em",
            fontSize: "clamp(4rem, 16vw, 15rem)",
            lineHeight: 1,
            transform: `translate(0px, 20px)`,
          }}
        >
          {backgroundText}
        </h1>
      </div>

      {/* 3D Canvas */}
      <div className="absolute inset-0 z-10">
        <Canvas shadows camera={{ position: [0, 0.2, 5.8], fov: 40 }}>
          <ambientLight intensity={entorno.luzAmbiente} color="#ffffff" />

          <directionalLight
            position={[0, 6, 3]}
            intensity={entorno.luzPrincipal}
            color={entorno.luzPrincipalColor}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0005}
          />

          <directionalLight
            position={[-5, 2, -5]}
            intensity={entorno.luzRelleno}
            color={entorno.luzRellenoColor}
          />

          <Environment preset="city" blur={0.5} />

          <ResponsiveGroup scale={scale}>
            <ContactShadows
              position={[0, -0.79, 0]}
              opacity={entorno.sombraOpacidad}
              scale={15}
              resolution={1024}
              blur={entorno.sombraBlur}
              far={2.5}
              color="#000000"
            />
            <RobotPrototype
              neckParams={{
                baseR: 0.215,
                baseH: -0.05,
                midR: 0.28,
                midH: 0.02,
                lipBottomR: 0.295,
                lipBottomH: 0.045,
                lipTopR: 0.27,
                lipTopH: 0.055,
                innerR: 0.1,
                innerDropH: 0.0,
              }}
              bodyParams={{
                bodyBevelR: 0.235,
                bodyBevelY: 0.34,
                bodyBevelT: 0.025,
              }}
              color={color}
              pantallaColor={effectivePantallaColor}
              pantallaBrillo={effectivePantallaBrillo}
              blinkCycle={blinkCycle}
              metalness={metalness}
              onEmotionTrigger={cycleEmotion}
              isLovedActive={activeEmotion.isLoved}
            />
          </ResponsiveGroup>
        </Canvas>
      </div>

      {/* Overlay UI & Interactive Emotion Controls */}
      <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-6 sm:p-10">
        {/* Top Header Row inside Hero */}
        <div className="w-full flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-medium text-light-100">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: activeEmotion.glowColor }}
            />
            AI Interviewer: <span className="font-semibold capitalize text-white">{activeEmotion.label}</span>
          </div>

          <div className="text-xs text-light-100/60 hidden sm:block">
            Click robot or pick a mood below
          </div>
        </div>

        {/* Bottom Hero Controls & Emotion Pill Switcher */}
        <div className="w-full pointer-events-auto flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
          {/* Emotion Pills */}
          {showEmotionPills && (
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-full bg-black/50 backdrop-blur-lg border border-white/10 shadow-lg">
              {(Object.keys(ROBOT_EMOTIONS) as RobotEmotion[]).map((emoKey) => {
                const emo = ROBOT_EMOTIONS[emoKey];
                const isActive = currentEmotionKey === emoKey;
                return (
                  <button
                    key={emoKey}
                    onClick={() => setCurrentEmotionKey(emoKey)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                      isActive
                        ? "bg-white/20 text-white shadow-sm"
                        : "text-light-100/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: emo.glowColor }}
                    />
                    {emo.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/interview"
              className="px-6 py-2.5 rounded-full text-sm font-semibold text-black transition-all hover:scale-105 flex items-center gap-2 shadow-lg"
              style={{
                backgroundColor: activeEmotion.glowColor,
                boxShadow: `0 0 25px ${activeEmotion.glowColor}55`,
              }}
            >
              <PiSparkleFill className="text-black" />
              {ctaText}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default RobotHero;
