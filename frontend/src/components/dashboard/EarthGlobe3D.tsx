import React, { useEffect, useRef, useState } from "react";
import { RotateCw, Compass } from "lucide-react";

const VS_SOURCE = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FS_SOURCE = `
precision highp float;
varying vec2 vUv;
uniform vec2 uResolution;
uniform float uYaw;
uniform float uPitch;
uniform float uTime;
uniform sampler2D uEarthTexture;

// Pseudo-random starfield
float rand(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 st = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float radius = 0.44;
  float dist = length(st);

  // Deep space background with atmospheric limb glow and stars
  if (dist > radius) {
    float glow = exp(-20.0 * (dist - radius)) * 0.85;
    vec3 spaceColor = vec3(0.012, 0.02, 0.035);
    float star = step(0.9982, rand(floor(gl_FragCoord.xy * 0.4)));
    vec3 finalSpace = spaceColor + star * vec3(0.7, 0.85, 1.0) * 0.4;
    vec3 glowColor = vec3(0.25, 0.65, 1.0) * glow;
    gl_FragColor = vec4(finalSpace + glowColor, 1.0);
    return;
  }

  // 3D Sphere Surface Normal
  float z = sqrt(max(0.0, radius * radius - dist * dist));
  vec3 N = normalize(vec3(st.x, st.y, z));

  // Rotate Normal by Pitch (X-axis) and Yaw (Y-axis)
  float cy = cos(uYaw);
  float sy = sin(uYaw);
  float cp = cos(uPitch);
  float sp = sin(uPitch);

  vec3 np = vec3(N.x, cp * N.y - sp * N.z, sp * N.y + cp * N.z);
  vec3 rotatedN = vec3(cy * np.x + sy * np.z, np.y, -sy * np.x + cy * np.z);

  // Spherical Equirectangular Coordinates
  float PI = 3.141592653589793;
  float lon = atan(rotatedN.x, rotatedN.z);
  float lat = asin(clamp(rotatedN.y, -1.0, 1.0));

  float u = lon / (2.0 * PI) + 0.5;
  float v = lat / PI + 0.5;

  vec4 earthColor = texture2D(uEarthTexture, vec2(u, v));

  // Directional Space Sunlight
  vec3 lightDir = normalize(vec3(-0.45, 0.35, 0.85));
  float NdotL = dot(N, lightDir);
  float diffuse = max(0.06, NdotL);
  diffuse = pow(diffuse, 0.85) * 1.25;

  // Rayleigh Limb Atmospheric Blue Glow
  float rim = 1.0 - max(0.0, N.z);
  vec3 rimGlow = vec3(0.28, 0.68, 1.0) * pow(rim, 3.6) * 1.35;

  vec3 finalColor = earthColor.rgb * diffuse + rimGlow;

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

// Initial angle centering directly on India (78.96°E, 20.59°N) with North Pole at Top
const INDIA_YAW = 1.38;
const INDIA_PITCH = -0.36;

export function EarthGlobe3D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const yawRef = useRef<number>(INDIA_YAW);
  const pitchRef = useRef<number>(INDIA_PITCH);
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const autoRotateRef = useRef<boolean>(false);

  // Sync ref with state for render loop
  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      canvas.getContext("webgl", { antialias: true, alpha: false }) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);

    if (!gl) {
      console.warn("WebGL not supported for 3D Earth Globe");
      return;
    }

    // Compile Shaders
    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = createShader(gl.VERTEX_SHADER, VS_SOURCE);
    const fs = createShader(gl.FRAGMENT_SHADER, FS_SOURCE);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    // Quad Buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    // Uniform Locations
    const uResolution = gl.getUniformLocation(program, "uResolution");
    const uYaw = gl.getUniformLocation(program, "uYaw");
    const uPitch = gl.getUniformLocation(program, "uPitch");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uEarthTexture = gl.getUniformLocation(program, "uEarthTexture");

    // Ensure textures are flipped correctly so North is at the Top
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    // Load Official NASA Blue Marble Earth Texture
    const earthTex = gl.createTexture();
    const earthImg = new Image();
    earthImg.src = "/textures/earth_nasa.jpg";
    earthImg.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, earthTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        earthImg,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };

    let animId: number;
    let startTime = performance.now();

    const render = (now: number) => {
      const elapsed = (now - startTime) * 0.001;

      // Only slow gentle spin if explicitly enabled (Geostationary lock by default)
      if (autoRotateRef.current && !isDraggingRef.current) {
        yawRef.current += 0.0003;
      }

      // Handle Resize
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uYaw, yawRef.current);
      gl.uniform1f(uPitch, pitchRef.current);
      gl.uniform1f(uTime, elapsed);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, earthTex);
      gl.uniform1i(uEarthTexture, 0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      gl.deleteProgram(program);
      gl.deleteBuffer(positionBuffer);
      gl.deleteTexture(earthTex);
    };
  }, []);

  // Mouse drag handlers to rotate the 3D globe freely
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    yawRef.current -= dx * 0.005;
    pitchRef.current = Math.max(
      -1.1,
      Math.min(1.1, pitchRef.current + dy * 0.005),
    );
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Touch drag support for tablet and mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      isDraggingRef.current = true;
      lastMousePosRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length === 0) return;
    const dx = e.touches[0].clientX - lastMousePosRef.current.x;
    const dy = e.touches[0].clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };

    yawRef.current -= dx * 0.005;
    pitchRef.current = Math.max(
      -1.1,
      Math.min(1.1, pitchRef.current + dy * 0.005),
    );
  };

  const handleResetIndia = () => {
    yawRef.current = INDIA_YAW;
    pitchRef.current = INDIA_PITCH;
  };

  return (
    <div
      className="relative w-full h-full cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Action pill buttons on top right */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setAutoRotate((prev) => !prev)}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-medium backdrop-blur-xs transition cursor-pointer shadow-sm ${
            autoRotate
              ? "bg-accent text-accent-contrast border-accent/60"
              : "bg-black/70 text-white/80 border-white/15 hover:bg-black/90"
          }`}
          title={autoRotate ? "Pause orbit spin" : "Slow orbit spin"}
        >
          <RotateCw size={10} className={autoRotate ? "animate-spin" : ""} />
          <span>{autoRotate ? "Orbiting" : "Geostationary"}</span>
        </button>

        <button
          type="button"
          onClick={handleResetIndia}
          className="flex items-center gap-1 bg-black/70 hover:bg-black/90 text-white/90 px-1.5 py-0.5 rounded border border-white/15 text-[9px] font-medium backdrop-blur-xs transition cursor-pointer shadow-sm hover:text-cyan-300"
          title="Center directly over Indian Subcontinent"
        >
          <Compass size={10} className="text-cyan-400" />
          <span>Center India</span>
        </button>
      </div>

      {/* Drag hint overlay */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-[8.5px] text-white/60 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
        Drag to rotate 3D Earth
      </div>
    </div>
  );
}
