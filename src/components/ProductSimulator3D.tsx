import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Environment, RoundedBox } from "@react-three/drei";
import { useRef, Suspense } from "react";
import * as THREE from "three";

interface Props {
  customName: string;
  textColor: string;
  fontSize: number;
  fontFamily: string;
  bottleColor: string;
}

function Bottle({ bottleColor }: { bottleColor: string }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  const color = new THREE.Color(bottleColor || "#333333");

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.42, 2.2, 32]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 1.3, 0]}>
        <cylinderGeometry args={[0.2, 0.35, 0.5, 32]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.25} />
      </mesh>
      {/* Cap */}
      <mesh position={[0, 1.7, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.35, 32]} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Bottom ring */}
      <mesh position={[0, -1.1, 0]}>
        <cylinderGeometry args={[0.44, 0.44, 0.08, 32]} />
        <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

function BottleText({ customName, textColor, fontSize }: { customName: string; textColor: string; fontSize: number }) {
  const textRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (textRef.current) {
      textRef.current.rotation.y += delta * 0.3;
    }
  });

  if (!customName.trim()) return null;

  const scaledSize = 0.08 + (fontSize - 14) * 0.004;

  return (
    <group ref={textRef}>
      <Text
        position={[0, 0.1, 0.42]}
        fontSize={scaledSize}
        color={textColor}
        anchorX="center"
        anchorY="middle"
        maxWidth={0.7}
        outlineWidth={0.003}
        outlineColor="#000000"
      >
        {customName}
      </Text>
    </group>
  );
}

export default function ProductSimulator3D({ customName, textColor, fontSize, bottleColor }: Props) {
  return (
    <div className="w-full aspect-square rounded-xl overflow-hidden bg-gradient-to-b from-muted to-muted/50 border border-border">
      <Canvas
        camera={{ position: [0, 0.5, 3.5], fov: 35 }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <directionalLight position={[-3, 3, -3]} intensity={0.4} />
          <pointLight position={[0, 3, 0]} intensity={0.3} />

          <Bottle bottleColor={bottleColor} />
          <BottleText customName={customName} textColor={textColor} fontSize={fontSize} />

          <OrbitControls
            enablePan={false}
            enableZoom={false}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.8}
            autoRotate={false}
          />
          <Environment preset="studio" />
        </Suspense>
      </Canvas>
    </div>
  );
}
