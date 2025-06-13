
import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Fallback for when drei components fail to load
const SimpleAnimatedSphere: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.8, 32, 32]} />
      <meshStandardMaterial
        color="#8B5CF6"
        roughness={0.1}
        metalness={0.8}
        emissive="#4C1D95"
        emissiveIntensity={0.2}
      />
    </mesh>
  );
};

const FloatingText: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* We'll use simple geometries instead of Text component for reliability */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3, 0.5, 0.1]} />
        <meshStandardMaterial 
          color="#8B5CF6" 
          emissive="#4C1D95"
          emissiveIntensity={0.3}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
};

const ParticleField: React.FC = () => {
  const particlesRef = useRef<THREE.Points>(null);
  
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(1000 * 3);
    
    for (let i = 0; i < 1000; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    
    return positions;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={1000}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#A855F7"
        transparent
        opacity={0.6}
        sizeAttenuation={true}
      />
    </points>
  );
};

interface LoginSuccessAnimationProps {
  onComplete: () => void;
}

const LoginSuccessAnimation: React.FC<LoginSuccessAnimationProps> = ({ onComplete }) => {
  const spherePositions: [number, number, number][] = [
    [-3, 2, -2],
    [3, -1, -1],
    [-2, -2, 1],
    [4, 1, 0]
  ];

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 overflow-hidden">
      <Suspense fallback={
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-purple-400 text-lg">Entering the underground...</p>
          </div>
        </div>
      }>
        <Canvas 
          camera={{ position: [0, 0, 8], fov: 75 }}
          onCreated={({ gl }) => {
            gl.setClearColor('#1a1a2e', 1);
          }}
        >
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#8B5CF6" />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#A855F7" />
          <directionalLight position={[0, 5, 5]} intensity={0.5} color="#FFFFFF" />
          
          <ParticleField />
          <FloatingText />
          
          {spherePositions.map((position, index) => (
            <SimpleAnimatedSphere key={index} position={position} />
          ))}
        </Canvas>
      </Suspense>
      
      {/* Text Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse">
            🕶️ UnderCover
          </h1>
          <p className="text-xl text-purple-300 animate-fade-in">
            Welcome to the shadows...
          </p>
        </div>
      </div>
      
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center space-x-2 text-purple-400">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Entering the underground...</span>
        </div>
      </div>
    </div>
  );
};

export default LoginSuccessAnimation;
