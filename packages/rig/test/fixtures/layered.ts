import type { LayeredModel } from '../../src/layered-types.js'
export function layeredModel(): LayeredModel {
  return {version:2,renderer:'layered',id:'fixture',name:'Fixture',source:{width:100,height:200,fallback:'fallback.png',sha256:'a'.repeat(64)},
    atlases:[{id:'atlas',src:'atlas.png',width:256,height:256}],
    nodes:[{id:'root',pivot:[.5,.5],rotation:.4,translation:[.02,.01],response:100},{id:'tip',parent:'root',pivot:[.5,.5],rotation:0,translation:[0,0],response:100,spring:{rotation:.08,stiffness:.04,damping:.92,wind:1,phase:0}}],
    joints:[{id:'join',position:[.5,.5],weights:[{node:'root',weight:1}]}],
    attachments:[{id:'left',atlas:'atlas',rect:[2,2,100,200],bounds:[0,0,1,1],coverage:'complete',provenance:'synthetic fixture',vertices:[{position:[.1,.5],weights:[{node:'root',weight:1}]},{position:[.5,.5],weights:[{node:'root',weight:1}],joint:'join'},{position:[.5,.9],weights:[{node:'tip',weight:1}]}],triangles:[0,1,2]},
    {id:'right',atlas:'atlas',rect:[104,2,100,200],bounds:[0,0,1,1],coverage:'complete',provenance:'synthetic fixture',vertices:[{position:[.5,.5],weights:[{node:'root',weight:1}],joint:'join'},{position:[.9,.5],weights:[{node:'root',weight:1}]},{position:[.5,.9],weights:[{node:'tip',weight:1}]}],triangles:[0,1,2]}]}
}
