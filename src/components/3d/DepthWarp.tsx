"use client";

import { useEffect, useRef, useState } from "react";
import type { MotionValue } from "framer-motion";
import { cn } from "@/lib/cn";

type DepthWarpProps = {
  src: string;
  /** Grayscale depth map (white = closest to the viewer), same framing as `src`. */
  depthSrc: string;
  /** Head aim in [-1, 1]. */
  aimX: MotionValue<number>;
  aimY: MotionValue<number>;
  /** Max parallax shift in UV units (fraction of the image). */
  strength: number;
  className?: string;
  /** Called once WebGL has drawn its first frame (so a fallback image can hide). */
  onReady?: () => void;
};

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

// Depth-based parallax: near pixels (the face) slide toward the aim, far pixels
// (ears, turban edges) slide away — which reads as the head turning in 3D.
const FRAG = `
precision mediump float;
uniform sampler2D uImg;
uniform sampler2D uDepth;
uniform vec2 uOff;
varying vec2 vUv;
void main() {
  vec2 uv = vUv;
  for (int i = 0; i < 4; i++) {
    float d = texture2D(uDepth, uv).r;
    uv = vUv - (d - 0.5) * uOff;
  }
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0);
  } else {
    gl_FragColor = texture2D(uImg, uv);
  }
}`;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** WebGL 2.5D head turn driven by a depth map. Renders nothing if WebGL is unavailable. */
export function DepthWarp({ src, depthSrc, aimX, aimY, strength, className, onReady }: DepthWarpProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) {
      setFailed(true);
      return;
    }

    let disposed = false;
    let frame = 0;
    let uOff: WebGLUniformLocation | null = null;

    const compile = (type: number, source: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, source);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setFailed(true);
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    uOff = gl.getUniformLocation(prog, "uOff");

    const makeTexture = (img: HTMLImageElement, unit: number, premultiply: boolean) => {
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultiply);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const draw = () => {
      frame = 0;
      gl.uniform2f(uOff, aimX.get() * strength, aimY.get() * strength * 0.75);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const schedule = () => {
      if (!frame && !disposed) frame = requestAnimationFrame(draw);
    };

    const ro = new ResizeObserver(() => {
      resize();
      schedule();
    });

    let unsubX = () => {};
    let unsubY = () => {};

    Promise.all([loadImage(src), loadImage(depthSrc)])
      .then(([img, depth]) => {
        if (disposed) return;
        makeTexture(img, 0, true);
        makeTexture(depth, 1, false);
        gl.uniform1i(gl.getUniformLocation(prog, "uImg"), 0);
        gl.uniform1i(gl.getUniformLocation(prog, "uDepth"), 1);
        ro.observe(canvas);
        resize();
        draw();
        unsubX = aimX.on("change", schedule);
        unsubY = aimY.on("change", schedule);
        onReady?.();
      })
      .catch(() => setFailed(true));

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      unsubX();
      unsubY();
    };
  }, [src, depthSrc, aimX, aimY, strength, onReady]);

  if (failed) return null;
  return <canvas ref={canvasRef} aria-hidden className={cn("pointer-events-none absolute inset-0 size-full", className)} />;
}
