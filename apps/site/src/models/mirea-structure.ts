import type { Vec2 } from '@yuragi/rig'

// Read-only source measurements, not extra skinning pins or an IK rig.
// Source: mirea-base-v1.png, 1024×1536, inspected 2026-10-03.
export const mireaStructureSource = '6382f74df8b5dcfa4f85cb2120c7260021236c02b478eef0724171e79ffaba05'
export interface StructurePoint { id: string; label: string; point: Vec2; parent?: string; inferred?: boolean }
export const mireaStructure: StructurePoint[] = [
  { id: 'waist', label: '腰部', point: [.58,.355] },
  { id: 'neck-base', label: '頸部基點', point: [.576,.237], parent: 'waist' },
  { id: 'head-root', label: '頭部根點', point: [.57,.213], parent: 'neck-base' },
  { id: 'head-center', label: '頭部中心', point: [.555,.172], parent: 'head-root' },
  { id: 'head-top', label: '頭頂', point: [.552,.106], parent: 'head-center' },
  { id: 'holding-shoulder', label: '持傘側肩部', point: [.488,.236], parent: 'neck-base' },
  { id: 'holding-elbow', label: '持傘側手肘', point: [.419,.356], parent: 'holding-shoulder' },
  { id: 'holding-wrist', label: '持傘側手腕', point: [.444,.285], parent: 'holding-elbow' },
  { id: 'umbrella-grip', label: '持傘接點', point: [.444,.275], parent: 'holding-wrist' },
  { id: 'umbrella-canopy', label: '傘面', point: [.34,.075], parent: 'umbrella-grip' },
  { id: 'free-shoulder', label: '垂手側肩部', point: [.662,.266], parent: 'neck-base' },
  { id: 'free-elbow', label: '垂手側手肘', point: [.712,.414], parent: 'free-shoulder' },
  { id: 'free-wrist', label: '垂手側手腕', point: [.75,.506], parent: 'free-elbow' },
  { id: 'hip-front', label: '前腿髖部（遮擋推估）', point: [.492,.48], parent: 'waist', inferred: true },
  { id: 'knee-front', label: '前腿膝蓋', point: [.552,.65], parent: 'hip-front' },
  { id: 'ankle-front', label: '前腿腳踝', point: [.494,.833], parent: 'knee-front' },
  { id: 'toe-front', label: '前腿鞋尖', point: [.481,.911], parent: 'ankle-front' },
  { id: 'hip-back', label: '後腿髖部（遮擋推估）', point: [.599,.51], parent: 'waist', inferred: true },
  { id: 'knee-back', label: '後腿膝蓋', point: [.591,.666], parent: 'hip-back' },
  { id: 'ankle-back', label: '後腿腳踝', point: [.537,.869], parent: 'knee-back' },
  { id: 'toe-back', label: '後腿鞋尖', point: [.511,.979], parent: 'ankle-back' },
]
