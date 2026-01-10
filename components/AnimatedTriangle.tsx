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

    // Create 3D pyramid (tetrahedron) - 4 vertices
    const pyramidGeometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      // Base triangle (top)
      -0.5,
      0.3,
      0.0, // vertex 0: top left
      0.5,
      0.3,
      0.0, // vertex 1: top right
      0.0,
      0.3,
      -0.4, // vertex 2: top back (adds depth)

      // Apex (bottom point)
      0.0,
      -0.5,
      -0.2, // vertex 3: bottom apex (centered in Z)
    ]);
    pyramidGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(vertices, 3)
    );

    // Define the 4 triangular faces of the tetrahedron
    const indices = new Uint16Array([
      0, 1, 2, // top base triangle
      0, 1, 3, // front face
      1, 2, 3, // right face
      2, 0, 3, // left face
    ]);
    pyramidGeometry.setIndex(new THREE.BufferAttribute(indices, 1));

    // Extract edges for wireframe rendering
    const edges = new THREE.EdgesGeometry(pyramidGeometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: 0x00ccff, // Cyan cyberpunk color
      linewidth: 2,
      transparent: true,
      opacity: 1,
    });
    const wireframe = new THREE.LineSegments(edges, wireframeMaterial);
    scene.add(wireframe);

    // Animation - slow continuous rotation around vertical axis (left to right spin)
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (document.hidden) return;

      // Slow continuous rotation around Y-axis (vertical - spins left to right)
      wireframe.rotation.y += 0.02;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (
        rendererRef.current &&
        container.contains(rendererRef.current.domElement)
      ) {
        container.removeChild(rendererRef.current.domElement);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      pyramidGeometry.dispose();
      edges.dispose();
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
