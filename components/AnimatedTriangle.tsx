import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function AnimatedTriangle() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    const container = containerRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 2;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(160, 160);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create downward pointing triangle (upside down)
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0.0, -0.5, 0.0,   // bottom vertex (pointing down)
      -0.5, 0.5, 0.0,   // top left
      0.5, 0.5, 0.0,    // top right
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    // Define the face indices
    const indices = new Uint16Array([0, 1, 2]);
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    // Create invisible material (only wireframe will be visible)
    const material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });

    const triangle = new THREE.Mesh(geometry, material);
    scene.add(triangle);

    // Add glowing outline
    const wireframeGeometry = new THREE.EdgesGeometry(geometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: 0x00ccff,  // Cyan cyberpunk color
      linewidth: 2,
      transparent: true,
      opacity: 1,
    });
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    scene.add(wireframe);

    // Animation
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (document.hidden) return;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      geometry.dispose();
      material.dispose();
      wireframeGeometry.dispose();
      wireframeMaterial.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="inline-block"
      style={{
        width: '160px',
        height: '160px',
      }}
    />
  );
}
