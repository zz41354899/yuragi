import type { Vec2 } from './api-types.js';
/** Separate from RigModel v1; extracted PNGs are never implicitly playable. */
export interface LayeredModel {
    version: 2;
    renderer: 'layered';
    id: string;
    name: string;
    source: {
        width: number;
        height: number;
        fallback: string;
        sha256: string;
    };
    atlases: {
        id: string;
        src: string;
        width: number;
        height: number;
    }[];
    /** Parent precedes child. Pivots and translations use full-source coordinates. */
    nodes: LayerNode[];
    /** Authoritative seam vertices, reused by any number of attachments. */
    joints: {
        id: string;
        position: Vec2;
        weights: LayerWeight[];
    }[];
    /** Array order IS draw order. Only consecutive compatible attachments batch. */
    attachments: LayerAttachment[];
    hairGroups?: { id: string; nodes: string[]; coupling: number }[];
    face?: LayeredFace;
}
export interface LayerWeight {
    node: string;
    weight: number;
}
export interface LayerNode {
    id: string;
    parent?: string;
    pivot: Vec2;
    rotation: number;
    translation: Vec2;
    response: number;
    /** Bounded local secondary rotation; root vertices bind to the parent. */
    spring?: {
        rotation: number;
        stiffness: number;
        damping: number;
        wind: number;
        phase: number;
    };
}
export interface LayerVertex {
    position: Vec2;
    weights: LayerWeight[];
    joint?: string;
}
export interface LayerAttachment {
    id: string;
    atlas: string;
    /** Atlas pixel rectangle, excluding extruded gutters. */
    rect: [
        number,
        number,
        number,
        number
    ];
    /** Source-normalized rectangle corresponding to the cropped image. */
    bounds: [
        number,
        number,
        number,
        number
    ];
    vertices: LayerVertex[];
    triangles: number[];
    opacity?: number;
    /** Optional static alpha mask in the SAME atlas, aligned to attachment bounds. */
    mask?: [
        number,
        number,
        number,
        number
    ];
    coverage: 'complete' | 'visible-only';
    provenance: string;
}
export interface LayeredSnapshot {
    playing: boolean;
    reducedMotion: boolean;
    pointer: Vec2;
    face?: LayeredFacePose & { gaze: Vec2 };
    nodes: {
        id: string;
        rotation: number;
    }[];
    diagnostics: {
        drawCalls: number;
        vertices: number;
        triangles: number;
        atlasBytes: number;
        cpuMilliseconds: number;
    };
}
export interface LayeredPlayerOptions {
    canvas: HTMLCanvasElement;
    model: LayeredModel;
    autoplay?: boolean;
    manual?: boolean;
    reducedMotion?: 'respect' | 'ignore';
    pixelRatio?: number;
    signal?: AbortSignal;
    onFrame?: (snapshot: LayeredSnapshot) => void;
    onError?: (error: Error) => void;
}
export interface LayeredPlayer {
    play(): void;
    pause(): void;
    advance(milliseconds: number): void;
    setGaze(x: number, y: number): void;
    setFace(pose: LayeredFacePose): void;
    setPointer(x: number, y: number): void;
    reset(): void;
    getModel(): LayeredModel;
    getSnapshot(): LayeredSnapshot;
    getMeshSnapshot(): {
        rest: Float32Array;
        positions: Float32Array;
        indices: Uint16Array;
    };
    destroy(): void;
}

export type MouthShape = 'closed' | 'a' | 'i' | 'u' | 'e' | 'o';
export interface LayeredFacePose { eyeOpenLeft?: number; eyeOpenRight?: number; mouthOpen?: number; mouthShape?: MouthShape }
export interface LayeredEye {
    side: 'left' | 'right';
    /** All layers use the same head node. Skin under lids must be supplied. */
    node: string;
    ball: string;
    iris?: string;
    lines: string[];
    half: string;
    closed: string;
    /** Sampled source-normalized eye edges, increasing X. */
    top: [number, number][];
    bottom: [number, number][];
    travel: Vec2;
}
export interface LayeredFace {
    eyes?: LayeredEye[];
    mouth?: { node: string; shapes: Partial<Record<MouthShape, string>> };
}
