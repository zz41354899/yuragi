import type { RigMeshSnapshot, Vec2 } from '@z7589xxz758/yuragi'

/** Sample the actual rendered triangle of the regular continuous source mesh. */
export function meshPoint(mesh: RigMeshSnapshot, columns: number, rows: number, [x,y]: Vec2): Vec2 {
  const gx=Math.max(0,Math.min(columns,x*columns)), gy=Math.max(0,Math.min(rows,y*rows))
  const col=Math.min(columns-1,Math.floor(gx)), row=Math.min(rows-1,Math.floor(gy))
  const u=gx-col, v=gy-row, offset=(row*columns+col)*6
  const triangle=u>=v ? offset : offset+3
  const weights=u>=v ? [1-u,u-v,v] : [1-v,u,v-u]
  let px=0,py=0
  for(let i=0;i<3;i++) {const vertex=mesh.indices[triangle+i]*2;px+=mesh.positions[vertex]*weights[i];py+=mesh.positions[vertex+1]*weights[i]}
  return [px,py]
}

export function drawMesh(canvas: HTMLCanvasElement, mesh: RigMeshSnapshot, pin?: string) {
  const context=canvas.getContext('2d')
  if(!context)return
  // Fixed source resolution; CSS follows artwork zoom/pan without new engine work.
  canvas.width=1024;canvas.height=1536
  const count=mesh.pinNames.length, selected=pin ? mesh.pinNames.indexOf(pin) : -1
  if(selected>=0) {
    for(let offset=0;offset<mesh.indices.length;offset+=3) {
      const vertices=[mesh.indices[offset],mesh.indices[offset+1],mesh.indices[offset+2]]
      const weight=vertices.reduce((sum,v)=>sum+mesh.weights[v*count+selected],0)/3
      if(weight<.015)continue
      context.beginPath()
      vertices.forEach((v,i)=>{const x=mesh.positions[v*2]*1024,y=mesh.positions[v*2+1]*1536;i ? context.lineTo(x,y) : context.moveTo(x,y)})
      context.closePath();context.fillStyle=`rgba(255,185,82,${weight*.65})`;context.fill()
    }
  }
  context.beginPath()
  for(let offset=0;offset<mesh.indices.length;offset+=3) {
    for(let i=0;i<4;i++) {const v=mesh.indices[offset+i%3],x=mesh.positions[v*2]*1024,y=mesh.positions[v*2+1]*1536;i ? context.lineTo(x,y) : context.moveTo(x,y)}
  }
  context.strokeStyle='rgba(115,225,242,.6)';context.lineWidth=.8;context.stroke()
}
