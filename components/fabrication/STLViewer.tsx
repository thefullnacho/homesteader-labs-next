"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type * as THREE from "three";

interface STLViewerProps {
  file: File | null;
  onVolumeCalculated: (volumeCm3: number, dimensions: { x: number; y: number; z: number }) => void;
  onError: (error: string) => void;
}

export default function STLViewer({ file, onVolumeCalculated, onError }: STLViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: { update: () => void; target: THREE.Vector3 };
    renderer: THREE.WebGLRenderer;
    THREE: typeof import("three");
  } | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationRef = useRef<number | null>(null);
  const loadedFileRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const initScene = useCallback(async () => {
    if (!containerRef.current || sceneRef.current) return;

    const THREE = await import("three");
    const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0a09); // Near black

    // Camera - wider FOV for better viewing
    const camera = new THREE.PerspectiveCamera(
      45, // Slightly more clinical FOV
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      5000
    );
    camera.position.set(150, 150, 150);

    // Renderer with optimized settings
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance",
      alpha: true
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls with damping for smooth interaction
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 2000;

    // Lights - High contrast, clinical
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(1, 1, 1);
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-1, -0.5, -1);
    scene.add(fillLight);

    // Grid - Subtle schematic grid
    const gridHelper = new THREE.GridHelper(400, 40, 0xff6600, 0x1c1917);
    gridHelper.position.y = -0.5;
    if (gridHelper.material instanceof THREE.Material) {
      gridHelper.material.transparent = true;
      gridHelper.material.opacity = 0.1;
    }
    scene.add(gridHelper);

    // Store refs
    sceneRef.current = { scene, camera, controls, renderer, THREE };

    // Animation loop
    function animate() {
      animationRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      renderer.dispose();
    };
  }, []);

  // Simplify geometry by merging close vertices
  const simplifyGeometry = useCallback((geometry: THREE.BufferGeometry, THREE_LIB: typeof import("three"), targetVertexCount: number = 10000) => {
    const positionAttribute = geometry.attributes.position;
    const currentCount = positionAttribute.count;
    
    if (currentCount <= targetVertexCount) return geometry;
    
    // Calculate simplification ratio
    const ratio = Math.ceil(currentCount / targetVertexCount);
    
    // Create new simplified geometry by taking every Nth triangle
    const newPositions: number[] = [];
    
    for (let i = 0; i < currentCount; i += ratio * 3) {
      // Take full triangles
      for (let j = 0; j < 3 && (i + j) < currentCount; j++) {
        newPositions.push(
          positionAttribute.getX(i + j),
          positionAttribute.getY(i + j),
          positionAttribute.getZ(i + j)
        );
      }
    }
    
    const simplifiedGeometry = new THREE_LIB.BufferGeometry();
    simplifiedGeometry.setAttribute('position', new THREE_LIB.Float32BufferAttribute(newPositions, 3));
    simplifiedGeometry.computeVertexNormals();
    
    console.log(`Simplified geometry: ${currentCount} -> ${newPositions.length / 3} vertices`);
    return simplifiedGeometry;
  }, []);

  const loadSTL = useCallback(async (stlFile: File) => {
    if (!sceneRef.current) return;
    
    // Prevent reloading the same file
    const fileKey = `${stlFile.name}-${stlFile.size}-${stlFile.lastModified}`;
    if (loadedFileRef.current === fileKey) {
      console.log("File already loaded, skipping");
      return;
    }
    
    loadedFileRef.current = fileKey;
    setIsLoading(true);

    try {
      console.log("Loading STL file:", stlFile.name, "Size:", stlFile.size);
      
      const { scene, camera, controls, renderer, THREE: THREE_LIB } = sceneRef.current;

      // Remove previous model
      const existingModel = scene.getObjectByName("stl-model");
      if (existingModel) {
        scene.remove(existingModel);
        if (existingModel instanceof THREE_LIB.Mesh) {
          if (existingModel.geometry) existingModel.geometry.dispose();
          if (existingModel.material) {
            if (Array.isArray(existingModel.material)) {
              existingModel.material.forEach((m: THREE.Material) => m.dispose());
            } else {
              existingModel.material.dispose();
            }
          }
        }
      }

      const { STLLoader } = await import("three/examples/jsm/loaders/STLLoader.js");
      const loader = new STLLoader();
      const arrayBuffer = await stlFile.arrayBuffer();
      
      console.log("Parsing STL, buffer size:", arrayBuffer.byteLength);
      
      let geometry = loader.parse(arrayBuffer);
      const originalVertexCount = geometry.attributes.position?.count || 0;
      console.log("Geometry loaded, vertices:", originalVertexCount);

      // Ensure geometry has position attribute
      if (!geometry.attributes.position) {
        throw new Error("Invalid STL file: no vertex data found");
      }

      // Simplify geometry if too many vertices (>50k)
      if (originalVertexCount > 50000) {
        geometry = simplifyGeometry(geometry, THREE_LIB, 30000);
      }

      // Compute bounding box BEFORE any transformations
      geometry.computeBoundingBox();
      
      if (!geometry.boundingBox) {
        throw new Error("Failed to compute model bounds");
      }

      const bbox = geometry.boundingBox;
      const dimensions = {
        x: (bbox.max.x - bbox.min.x),
        y: (bbox.max.y - bbox.min.y),
        z: (bbox.max.z - bbox.min.z),
      };
      
      console.log("Model dimensions (mm):", dimensions);

      // Calculate volume before centering
      let volume = 0;
      const positionAttribute = geometry.attributes.position;
      
      for (let i = 0; i < positionAttribute.count; i += 3) {
        const v1 = new THREE_LIB.Vector3(
          positionAttribute.getX(i),
          positionAttribute.getY(i),
          positionAttribute.getZ(i)
        );
        const v2 = new THREE_LIB.Vector3(
          positionAttribute.getX(i + 1),
          positionAttribute.getY(i + 1),
          positionAttribute.getZ(i + 1)
        );
        const v3 = new THREE_LIB.Vector3(
          positionAttribute.getX(i + 2),
          positionAttribute.getY(i + 2),
          positionAttribute.getZ(i + 2)
        );
        volume += signedVolumeOfTriangle(v1, v2, v3);
      }
      volume = Math.abs(volume);

      // Center geometry after getting dimensions
      geometry.center();

      // Volume is in mm³, convert to cm³
      const volumeCm3 = volume / 1000;

      // --- SCHEMATIC RENDERING ENGINE ---
      
      // 1. Primary Mesh (Semi-transparent dark faces)
      const material = new THREE_LIB.MeshPhongMaterial({
        color: 0x292524, // Stone-900
        flatShading: true,
        transparent: true,
        opacity: 0.8,
        shininess: 0,
      });

      const mesh = new THREE_LIB.Mesh(geometry, material);
      mesh.name = "stl-model-mesh";
      
      // 2. Wireframe Overlay (Technical structure)
      const wireframeMaterial = new THREE_LIB.MeshBasicMaterial({
        color: 0xff6600, // Accent color
        wireframe: true,
        transparent: true,
        opacity: 0.2,
      });
      const wireframe = new THREE_LIB.Mesh(geometry, wireframeMaterial);
      mesh.add(wireframe);

      // 3. Edge Outlines (Sharp schematic lines)
      const edges = new THREE_LIB.EdgesGeometry(geometry, 25); // 25 degree threshold for sharp edges
      const lineMaterial = new THREE_LIB.LineBasicMaterial({ 
        color: 0xff6600, 
        linewidth: 2,
        transparent: true,
        opacity: 0.8 
      });
      const lineSegments = new THREE_LIB.LineSegments(edges, lineMaterial);
      mesh.add(lineSegments);

      mesh.name = "stl-model";
      mesh.rotation.x = -Math.PI / 2; // Lay flat

      scene.add(mesh);
      console.log("Schematic mesh added to scene");

      // Fit camera to model
      const box = new THREE_LIB.Box3().setFromObject(mesh);
      const size = box.getSize(new THREE_LIB.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const center = box.getCenter(new THREE_LIB.Vector3());
      
      console.log("Bounding box size:", size, "Max dimension:", maxDim);
      
      // Calculate optimal camera distance based on FOV
      const fov = camera.fov * (Math.PI / 180);
      const cameraDistance = Math.max(maxDim / Math.tan(fov / 2) * 1.2, 50);
      
      camera.position.set(cameraDistance, cameraDistance * 0.8, cameraDistance);
      controls.target.copy(center);
      controls.update();

      // Force a render
      renderer.render(scene, camera);
      console.log("Render complete");

      onVolumeCalculated(volumeCm3, dimensions);
    } catch (err) {
      console.error("STL Loading Error:", err);
      loadedFileRef.current = null; // Reset so user can retry
      onError(err instanceof Error ? err.message : "Failed to parse STL file. Please ensure it's a valid STL file.");
    } finally {
      setIsLoading(false);
    }
  }, [onVolumeCalculated, onError, simplifyGeometry]);

  // Signed volume of triangle for mesh volume calculation
  function signedVolumeOfTriangle(p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3): number {
    return p1.dot(p2.cross(p3)) / 6.0;
  }

  useEffect(() => {
    initScene();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initScene]);

  // Load file when it changes
  useEffect(() => {
    if (file && sceneRef.current) {
      loadSTL(file);
    } else if (!file) {
      // Clear loaded file ref when file is cleared
      loadedFileRef.current = null;
    }
  }, [file, loadSTL]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[400px] border-2 border-theme-main bg-theme-sub relative"
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)] mx-auto mb-2"></div>
            <p className="text-sm">Loading 3D Model...</p>
          </div>
        </div>
      )}
    </div>
  );
}
