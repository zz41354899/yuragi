import type { EyeFeature, FaceFeatures, RigSnapshot } from './types.js'
const n=(value:number)=>value.toFixed(8)
const vec=(values:number[])=>`vec${values.length}(${values.map(n).join(',')})`
/** Compile reviewed feature geometry as constants, keeping WebGL1 uniform use small. */
export function faceFragment(features:FaceFeatures,width:number,height:number) {
  const eye=(e:EyeFeature)=>`color = eye(color, ${vec(e.center)}, ${vec([e.radius[0]*width,e.radius[1]*height])}, ${vec(e.iris)}, ${vec([e.irisRadius[0]*width,e.irisRadius[1]*height])}, ${vec(e.travel)}, ${n(e.angle)}, ${vec(e.sclera)});`
  return `#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif
    uniform sampler2D u_image; varying vec2 v_uv;
    uniform vec2 u_gaze;
    const vec2 size=${vec([width,height])};
    mat2 turn(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
    vec4 eye(vec4 color,vec2 center,vec2 radius,vec2 iris,vec2 irisRadius,vec2 travel,float angle,vec3 white){
      vec2 q=turn(angle)*((v_uv-center)*size);
      float inside=1.0-smoothstep(.94,1.08,length(q/radius));
      if(inside<.001)return color;
      vec2 shift=u_gaze*travel;
      float moving=min(1.0,length(shift*size)/.75);
      // Move only the pupil. The eye border, face UVs and mesh never shrink.
      if(moving>.0001){
        vec2 oldQ=turn(angle)*((v_uv-iris)*size);
        vec2 newQ=turn(angle)*((v_uv-iris-shift)*size);
        float erased=(1.0-smoothstep(.92,1.15,length(oldQ/irisRadius)))*inside*moving;
        color.rgb=mix(color.rgb,white,erased);
        float pupil=(1.0-smoothstep(.92,1.12,length(newQ/irisRadius)))*inside*moving;
        color=mix(color,texture2D(u_image,v_uv-shift),pupil);
      }
      return color;
    }
    void main(){vec4 color=texture2D(u_image,v_uv);
      ${eye(features.eyes[0])}
      ${eye(features.eyes[1])}
      gl_FragColor=color;
    }`
}
export function uploadFace(gl:WebGLRenderingContext,program:WebGLProgram,state:NonNullable<RigSnapshot['face']>) {
  gl.uniform2f(gl.getUniformLocation(program,'u_gaze'),...state.gaze)
}
