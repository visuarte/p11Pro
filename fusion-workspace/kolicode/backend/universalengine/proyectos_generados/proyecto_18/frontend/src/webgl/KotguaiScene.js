// KotguaiScene.js — Robust WebGL2 synthwave scene
// Features:
// - Particle field (configurable count) with organic motion
// - Central point-sphere displaced by simplex noise and audio-reactive
// - Screen-space perspective synthwave grid
// - Postprocess pipeline: bright-pass -> separable blur (ping/pong half-res) -> composite -> chromatic aberration
// - Audio input via connectAnalyser(analyserNode)
// Implementation notes:
// - Uses VAOs, attribute location 0 for positions to minimize lookups
// - Uses EXT_color_buffer_float when available for HDR-like bloom
// - Careful framebuffer sizing and half-resolution blurs for performance

export default class KotguaiScene {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.opts = Object.assign({ particles: 3000, spherePoints: 1800, bloomIterations: 2, bloomStrength: 1.0, grid: true }, opts);
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: false });
    if (!gl) throw new Error('WebGL2 not available');
    this.gl = gl;

    // capabilities
    this._extColorBufferFloat = !!gl.getExtension('EXT_color_buffer_float');

    // timing & audio
    this.time = 0; this.last = performance.now(); this.audioLevel = 0; this.analyser = null; this.freqData = null;

    // resources
    this._programs = {};
    this._vaos = {};
    this._buffers = {};
    this._fbos = {};
    this._shaders = [];

    // prepare
    this._initGL();
    this._createPrograms();
    this._createGeometry();
    this._createFramebuffers();

    // resize observer
    this._onResize = this.resize.bind(this);
    this._resizeObserver = new ResizeObserver(this._onResize);
    this._resizeObserver.observe(this.canvas);
    this.resize();

    this._boundLoop = this._loop.bind(this);
    this.running = false;
  }

  connectAnalyser(analyser) {
    this.analyser = analyser;
    if (analyser) this.freqData = new Uint8Array(analyser.frequencyBinCount);
  }

  start() { if (!this.running) { this.running = true; this.last = performance.now(); requestAnimationFrame(this._boundLoop); } }
  stop() { this.running = false; }
  dispose() {
    // Stop loop and observer
    this.stop();
    try { if (this._resizeObserver) this._resizeObserver.disconnect(); } catch (e) {}

    if (this.opts && this.opts.debug) console.log('[KotguaiScene] disposing GL resources');

    const gl = this.gl;
    // Delete GL programs
    if (this._programs) {
      for (const k in this._programs) {
        try { const p = this._programs[k]; if (p) gl.deleteProgram(p); } catch (e) {}
      }
    }

    // delete shaders if any
    if (this._shaders && this._shaders.length) {
      for (let i = 0; i < this._shaders.length; i++) {
        try { const s = this._shaders[i]; if (s) gl.deleteShader(s); } catch (e) {}
      }
    }

    // Delete VAOs
    if (this._vaos) {
      for (const k in this._vaos) {
        try { const v = this._vaos[k]; if (v) gl.deleteVertexArray(v); } catch (e) {}
      }
    }

    // Delete buffers
    if (this._buffers) {
      for (const k in this._buffers) {
        try { const b = this._buffers[k]; if (b) gl.deleteBuffer(b); } catch (e) {}
      }
    }

    // Delete FBOs and textures
    if (this._fbos) {
      for (const k in this._fbos) {
        try {
          const f = this._fbos[k];
          if (f) {
            if (f.tex) try { gl.deleteTexture(f.tex); } catch (e) {}
            if (f.fbo) try { gl.deleteFramebuffer(f.fbo); } catch (e) {}
          }
        } catch (e) {}
      }
    }

    // Clear references
    this._programs = {};
    this._vaos = {};
    this._buffers = {};
    this._fbos = {};
    this._shaders = [];
  }

  // restart: dispose and re-create all GL resources; preserves running state
  restart() {
    const wasRunning = this.running;
    if (this.opts && this.opts.debug) console.log('[KotguaiScene] restarting scene (wasRunning=', wasRunning, ')');
    this.dispose();
    // Recreate core resources
    this._initGL();
    this._createPrograms();
    this._createGeometry();
    this._createFramebuffers();
    this.resize();
    if (wasRunning) this.start();
  }

  resize() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.floor(this.canvas.clientWidth * dpr));
    const h = Math.max(1, Math.floor(this.canvas.clientHeight * dpr));
    if (this.canvas.width === w && this.canvas.height === h) return;
    this.canvas.width = w; this.canvas.height = h; this.gl.viewport(0,0,w,h);
    this._resizeFramebuffers(w,h);
  }

  // --- GL setup ---
  _initGL() {
    const gl = this.gl;
    gl.clearColor(0.02, 0.02, 0.035, 1.0);
    gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.PROGRAM_POINT_SIZE);
  }

  // --- Geometry ---
  _createGeometry() {
    const gl = this.gl;
    // Particles
    const pc = this.opts.particles; this.particleCount = pc;
    const pData = new Float32Array(pc * 3);
    this._particleSpeeds = new Float32Array(pc);
    for (let i=0;i<pc;i++){ const th=Math.random()*Math.PI*2; const r=6+Math.random()*40; pData[i*3]=Math.cos(th)*r; pData[i*3+1]=Math.sin(th)*r; pData[i*3+2]=(Math.random()-0.5)*40; this._particleSpeeds[i]=0.02+Math.random()*0.06; }
    const pBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,pBuf); gl.bufferData(gl.ARRAY_BUFFER,pData,gl.DYNAMIC_DRAW);
    const pVAO = gl.createVertexArray(); gl.bindVertexArray(pVAO); gl.bindBuffer(gl.ARRAY_BUFFER,pBuf); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0); gl.bindVertexArray(null);
    this._buffers.particles = pBuf; this._vaos.particles = pVAO; this._particlePositions = pData;

    // Sphere
    const sc = this.opts.spherePoints; this.sphereCount = sc;
    const sData = new Float32Array(sc*3); const golden = Math.PI*(3-Math.sqrt(5));
    for (let i=0;i<sc;i++){ const y=1-(i/(sc-1))*2; const r=Math.sqrt(Math.max(0,1-y*y)); const phi=i*golden; const x=Math.cos(phi)*r; const z=Math.sin(phi)*r; const scale=6.0; sData[i*3]=x*scale; sData[i*3+1]=y*scale; sData[i*3+2]=z*scale; }
    const sBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,sBuf); gl.bufferData(gl.ARRAY_BUFFER,sData,gl.STATIC_DRAW);
    const sVAO = gl.createVertexArray(); gl.bindVertexArray(sVAO); gl.bindBuffer(gl.ARRAY_BUFFER,sBuf); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0); gl.bindVertexArray(null);
    this._buffers.sphere = sBuf; this._vaos.sphere = sVAO;

    // Quad VAO
    this._vaos.quad = gl.createVertexArray();
  }

  // --- Framebuffers ---
  _createFramebuffers() {
    const gl = this.gl;
    const makeTex = (w,h,hdr=false)=>{ const tex=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,tex); const internal = hdr && this._extColorBufferFloat ? gl.RGBA16F : gl.RGBA8; const type = hdr && this._extColorBufferFloat ? gl.FLOAT : gl.UNSIGNED_BYTE; gl.texImage2D(gl.TEXTURE_2D,0,internal,w,h,0,gl.RGBA,type,null); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE); gl.bindTexture(gl.TEXTURE_2D,null); return tex; };
    const makeFBO = (w,h,hdr=false)=>{ const tex=makeTex(w,h,hdr); const fbo=gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER,fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0); const st=gl.checkFramebufferStatus(gl.FRAMEBUFFER); if (st!==gl.FRAMEBUFFER_COMPLETE) console.warn('FBO incomplete',st); gl.bindFramebuffer(gl.FRAMEBUFFER,null); return {fbo,tex,w,h,hdr}; };
    this._fbos.scene = makeFBO(1,1,true);
    this._fbos.bright = makeFBO(1,1,true);
    this._fbos.ping = makeFBO(1,1,true);
    this._fbos.pong = makeFBO(1,1,true);
    this._fbos.composite = makeFBO(1,1,false);
  }

  _resizeFramebuffers(w,h){ const gl=this.gl; const resize=(f,ww,hh)=>{ f.w=ww; f.h=hh; gl.bindTexture(gl.TEXTURE_2D,f.tex); const internal = f.hdr && this._extColorBufferFloat ? gl.RGBA16F : gl.RGBA8; const type = f.hdr && this._extColorBufferFloat ? gl.FLOAT : gl.UNSIGNED_BYTE; gl.texImage2D(gl.TEXTURE_2D,0,internal,ww,hh,0,gl.RGBA,type,null); gl.bindTexture(gl.TEXTURE_2D,null); }; resize(this._fbos.scene,w,h); resize(this._fbos.bright,w,h); resize(this._fbos.ping,Math.max(1,Math.floor(w/2)),Math.max(1,Math.floor(h/2))); resize(this._fbos.pong,Math.max(1,Math.floor(w/2)),Math.max(1,Math.floor(h/2))); resize(this._fbos.composite,w,h); }

  // --- Shaders & programs ---
  _createPrograms(){
    const quadVS = `#version 300 es
    precision highp float; out vec2 v_uv; void main(){ vec2 pos = vec2((gl_VertexID==1||gl_VertexID==2)?3.0:-1.0,(gl_VertexID==2||gl_VertexID==3)?3.0:-1.0); v_uv = pos*0.5+0.5; gl_Position = vec4(pos,0.0,1.0); }`;

    const pointVS = `#version 300 es
    precision highp float; layout(location=0) in vec3 a_position; uniform mat4 u_mvp; uniform float u_time; uniform float u_audio; out float v_alpha;
    // compact simplex (for displacement)
    vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;} vec4 mod289(vec4 x){return x - floor(x*(1.0/289.0))*289.0;} vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);} vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
    float snoise(vec3 v){ const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0); vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx); vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g,l.zxy); vec3 i2=max(g,l.zxy); vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy; i=mod289(i); vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0)); vec4 j = p - 49.0*floor(p*(1.0/49.0)); vec4 x_=floor(j*(1.0/7.0)); vec4 y_=floor(j-7.0*x_); vec4 x= x_*(1.0/7.0)-0.5; vec4 y= y_*(1.0/7.0)-0.5; vec4 h=1.0-abs(x)-abs(y); vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw); vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0)); vec4 a0=b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw + s1.xzyw*sh.zzww; vec3 g0=vec3(a0.x,a0.y,h.x); vec3 g1=vec3(a0.z,a0.w,h.y); vec3 g2=vec3(a1.x,a1.y,h.z); vec3 g3=vec3(a1.z,a1.w,h.w); vec4 norm=taylorInvSqrt(vec4(dot(g0,g0),dot(g1,g1),dot(g2,g2),dot(g3,g3))); g0*=norm.x; g1*=norm.y; g2*=norm.z; g3*=norm.w; float m0=max(0.6-dot(x0,x0),0.0); float m1=max(0.6-dot(x1,x1),0.0); float m2=max(0.6-dot(x2,x2),0.0); float m3=max(0.6-dot(x3,x3),0.0); m0*=m0; m1*=m1; m2*=m2; m3*=m3; float v0=m0*dot(g0,x0); float v1=m1*dot(g1,x1); float v2=m2*dot(g2,x2); float v3=m3*dot(g3,x3); return 32.0*(v0+v1+v2+v3); }
    void main(){ float n=snoise(vec3(a_position*0.12+u_time*0.35)); float disp = n * 0.8 * (1.0 + u_audio*4.0); vec3 pos = a_position + normalize(a_position) * disp; gl_Position = u_mvp * vec4(pos,1.0); v_alpha = 1.0 - length(a_position)*0.02; gl_PointSize = clamp(1.5 + u_audio*12.0,1.0,48.0); }
    `;

    const pointFS = `#version 300 es
    precision highp float; in float v_alpha; out vec4 outColor; void main(){ vec2 uv = gl_PointCoord-0.5; float r=length(uv); float mask = smoothstep(0.5,0.0,r); vec3 colA=vec3(0.0,0.9,0.95); vec3 colB=vec3(0.9,0.0,0.9); float stripe = fract(gl_FragCoord.y*0.02); vec3 color = mix(colA,colB,stripe*0.7+0.3); outColor = vec4(color*mask, v_alpha*mask); }`;

    const gridFS = `#version 300 es
    precision highp float; in vec2 v_uv; out vec4 outColor; uniform float u_time; uniform vec2 u_res; uniform float u_audio; vec3 palette(float t){ return mix(vec3(0.02,0.2,0.6), vec3(0.9,0.0,0.9), t); }
    void main(){ vec2 p=(v_uv-0.5)*vec2(u_res.x/u_res.y,1.0); float depth = 1.0 - pow(smoothstep(0.0,1.0,length(p)),0.6); float perspective = 1.5/(p.y+1.5+0.1*sin(u_time*0.5)); float line = abs(sin((p.x*perspective + u_time*0.2)*6.283)) * 0.5; float rows = abs(sin((p.y*perspective*6.0 + u_time*0.4))) * 0.5; float g = smoothstep(0.02,0.0,min(line,rows)); float glow = exp(-10.0*length(p))*0.8; vec3 col = palette(0.6+0.4*u_audio) * (g*0.9 + glow*0.7); outColor = vec4(col, clamp(g+glow,0.0,1.0)); }`;

    const brightFS = `#version 300 es
    precision highp float; in vec2 v_uv; out vec4 outColor; uniform sampler2D u_tex; uniform float u_threshold; void main(){ vec3 c=texture(u_tex,v_uv).rgb; float lum=dot(c,vec3(0.299,0.587,0.114)); float t=smoothstep(u_threshold,1.0,lum); outColor=vec4(c*t,1.0); }`;

    const blurFS = `#version 300 es
    precision highp float; in vec2 v_uv; out vec4 outColor; uniform sampler2D u_tex; uniform vec2 u_texel; void main(){ vec3 sum=vec3(0.0); float w[5]; w[0]=0.227027; w[1]=0.1945946; w[2]=0.1216216; w[3]=0.054054; w[4]=0.016216; for(int i=-4;i<=4;i++){ sum += texture(u_tex, v_uv + float(i)*u_texel).rgb * w[abs(i)]; } outColor = vec4(sum,1.0); }`;

    const compositeFS = `#version 300 es
    precision highp float; in vec2 v_uv; out vec4 outColor; uniform sampler2D u_scene; uniform sampler2D u_bloom; uniform float u_bloomStrength; vec3 tonemap(vec3 c){ c*=1.2; return c/(c+vec3(1.0)); } void main(){ vec3 scene=texture(u_scene,v_uv).rgb; vec3 bloom=texture(u_bloom,v_uv).rgb * u_bloomStrength; vec3 color = tonemap(scene + bloom); color = pow(color, vec3(1.0/2.2)); outColor=vec4(color,1.0); }`;

    const chromFS = `#version 300 es
    precision highp float; in vec2 v_uv; out vec4 outColor; uniform sampler2D u_tex; uniform float u_amount; uniform vec2 u_res; void main(){ vec2 dir=(v_uv-0.5)*vec2(u_res.x/u_res.y,1.0); vec2 off = dir*(u_amount*0.003); float r=texture(u_tex,v_uv+off).r; float g=texture(u_tex,v_uv).g; float b=texture(u_tex,v_uv-off).b; outColor=vec4(r,g,b,1.0); }`;

    // compile and link with attribute binding
    const compile = (vs,fs,attribs=[])=> this._compileProgram(vs,fs,attribs);
    this._programs.point = compile(pointVS,pointFS,['a_position']);
    this._programs.grid = compile(quadVS,gridFS);
    this._programs.bright = compile(quadVS,brightFS);
    this._programs.blur = compile(quadVS,blurFS);
    this._programs.composite = compile(quadVS,compositeFS);
    this._programs.chrom = compile(quadVS,chromFS);
  }

  _compileProgram(vsSrc, fsSrc, attribs=[]) {
    const gl = this.gl;
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vsSrc);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) throw new Error('VS: ' + gl.getShaderInfoLog(vs));

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fsSrc);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) throw new Error('FS: ' + gl.getShaderInfoLog(fs));

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    for (let i = 0; i < attribs.length; i++) {
      gl.bindAttribLocation(prog, i, attribs[i]);
    }
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('LINK: ' + gl.getProgramInfoLog(prog));

    // Track shaders so we can delete them on dispose
    try { this._shaders.push(vs, fs); } catch (e) { this._shaders = this._shaders || []; this._shaders.push(vs, fs); }

    return prog;
  }


  // --- Update ---
  _loop() { if(!this.running) return; const now = performance.now(); let dt=(now - this.last)/1000; dt=Math.min(dt,0.05); this.last=now; this.time+=dt; // audio
    if(this.analyser && this.freqData){ this.analyser.getByteFrequencyData(this.freqData); let sum=0; for(let i=0;i<this.freqData.length;i++){ const v=this.freqData[i]/255; sum+=v*v; } const rms=Math.sqrt(sum/this.freqData.length); this.audioLevel = this.audioLevel*0.92 + rms*0.08; } else { this.audioLevel = this.audioLevel*0.96 + Math.abs(Math.sin(this.time*0.6))*0.04; }
    this._updateParticles(dt); this._render(); requestAnimationFrame(this._boundLoop); }

  _updateParticles(dt){ const arr=this._particlePositions; const n=this.particleCount; for(let i=0;i<n;i++){ const idx=i*3; const x=arr[idx], y=arr[idx+1], z=arr[idx+2]; const ang=Math.atan2(y,x); const r=Math.hypot(x,y); const speed=this._particleSpeeds[i]*(1.0 + this.audioLevel*6.0); const nr=r - speed*dt*8.0; const nang=ang + speed*dt*0.5; arr[idx]=Math.cos(nang)*nr; arr[idx+1]=Math.sin(nang)*nr; arr[idx+2]=z + Math.sin(this.time*0.3 + i)*0.02; } const gl=this.gl; gl.bindBuffer(gl.ARRAY_BUFFER,this._buffers.particles); gl.bufferSubData(gl.ARRAY_BUFFER,0,arr); }

  // --- Render pipeline ---
  _render(){ const gl=this.gl; const w=this.canvas.width, h=this.canvas.height;
    // Scene pass
    gl.bindFramebuffer(gl.FRAMEBUFFER,this._fbos.scene.fbo); gl.viewport(0,0,w,h); gl.clearColor(0.02,0.02,0.035,1.0); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    // camera
    const proj=this._matrixPerspective(60*Math.PI/180, w/h, 0.1, 1000); const view=this._matrixTranslate(0,0,-60); const mvp=this._matrixMultiply(proj,view);
    // grid overlay
    if(this.opts.grid){ gl.useProgram(this._programs.grid); gl.bindVertexArray(this._vaos.quad); gl.uniform1f(gl.getUniformLocation(this._programs.grid,'u_time'),this.time); gl.uniform2f(gl.getUniformLocation(this._programs.grid,'u_res'),w,h); gl.uniform1f(gl.getUniformLocation(this._programs.grid,'u_audio'),this.audioLevel); gl.drawArrays(gl.TRIANGLES,0,6); }
    // render points
    gl.useProgram(this._programs.point); gl.uniformMatrix4fv(gl.getUniformLocation(this._programs.point,'u_mvp'),false,mvp); gl.uniform1f(gl.getUniformLocation(this._programs.point,'u_time'),this.time); gl.uniform1f(gl.getUniformLocation(this._programs.point,'u_audio'),this.audioLevel);
    gl.bindVertexArray(this._vaos.particles); gl.drawArrays(gl.POINTS,0,this.particleCount);
    gl.bindVertexArray(this._vaos.sphere); gl.drawArrays(gl.POINTS,0,this.sphereCount);

    // Bright pass -> ping (full res)
    gl.bindFramebuffer(gl.FRAMEBUFFER,this._fbos.bright.fbo); gl.viewport(0,0,w,h); gl.useProgram(this._programs.bright); gl.bindVertexArray(this._vaos.quad); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,this._fbos.scene.tex); gl.uniform1i(gl.getUniformLocation(this._programs.bright,'u_tex'),0); gl.uniform1f(gl.getUniformLocation(this._programs.bright,'u_threshold'),0.6); gl.drawArrays(gl.TRIANGLES,0,6);

    // Downsample bright to ping (half res) and blur iterations
    const pw=Math.max(1,Math.floor(w/2)), ph=Math.max(1,Math.floor(h/2));
    // downsample bright -> ping
    gl.bindFramebuffer(gl.FRAMEBUFFER,this._fbos.ping.fbo); gl.viewport(0,0,pw,ph); gl.useProgram(this._programs.blur); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,this._fbos.bright.tex); gl.uniform1i(gl.getUniformLocation(this._programs.blur,'u_tex'),0); gl.uniform2fv(gl.getUniformLocation(this._programs.blur,'u_texel'), new Float32Array([1.0/pw,0])); gl.drawArrays(gl.TRIANGLES,0,6);
    // iterative separable blur (vertical/horizontal)
    let src=this._fbos.ping, dst=this._fbos.pong; for(let it=0; it<this.opts.bloomIterations; it++){ // vertical
      gl.bindFramebuffer(gl.FRAMEBUFFER,dst.fbo); gl.viewport(0,0,pw,ph); gl.uniform2fv(gl.getUniformLocation(this._programs.blur,'u_texel'), new Float32Array([0,1.0/ph])); gl.bindTexture(gl.TEXTURE_2D,src.tex); gl.drawArrays(gl.TRIANGLES,0,6); // horizontal
      gl.bindFramebuffer(gl.FRAMEBUFFER,src.fbo); gl.viewport(0,0,pw,ph); gl.uniform2fv(gl.getUniformLocation(this._programs.blur,'u_texel'), new Float32Array([1.0/pw,0])); gl.bindTexture(gl.TEXTURE_2D,dst.tex); gl.drawArrays(gl.TRIANGLES,0,6);
    }

    // Composite scene + bloom -> composite FBO
    gl.bindFramebuffer(gl.FRAMEBUFFER,this._fbos.composite.fbo); gl.viewport(0,0,w,h); gl.useProgram(this._programs.composite); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,this._fbos.scene.tex); gl.uniform1i(gl.getUniformLocation(this._programs.composite,'u_scene'),0); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D,this._fbos.ping.tex); gl.uniform1i(gl.getUniformLocation(this._programs.composite,'u_bloom'),1); gl.uniform1f(gl.getUniformLocation(this._programs.composite,'u_bloomStrength'), this.opts.bloomStrength * (0.5 + this.audioLevel*1.5)); gl.drawArrays(gl.TRIANGLES,0,6);

    // Final chromatic pass to screen
    gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.viewport(0,0,w,h); gl.useProgram(this._programs.chrom); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,this._fbos.composite.tex); gl.uniform1i(gl.getUniformLocation(this._programs.chrom,'u_tex'),0); gl.uniform1f(gl.getUniformLocation(this._programs.chrom,'u_amount'), 0.6 * this.audioLevel); gl.uniform2f(gl.getUniformLocation(this._programs.chrom,'u_res'), w, h); gl.drawArrays(gl.TRIANGLES,0,6);
    gl.bindVertexArray(null);
  }

  // --- Math helpers ---
  _matrixPerspective(fovy, aspect, near, far){ const f=1.0/Math.tan(fovy/2); const nf=1/(near-far); const out=new Float32Array(16); out[0]=f/aspect; out[1]=0; out[2]=0; out[3]=0; out[4]=0; out[5]=f; out[6]=0; out[7]=0; out[8]=0; out[9]=0; out[10]=(far+near)*nf; out[11]=-1; out[12]=0; out[13]=0; out[14]=(2*far*near)*nf; out[15]=0; return out; }
  _matrixTranslate(x,y,z){ const m=new Float32Array(16); m[0]=1; m[1]=0; m[2]=0; m[3]=0; m[4]=0; m[5]=1; m[6]=0; m[7]=0; m[8]=0; m[9]=0; m[10]=1; m[11]=0; m[12]=x; m[13]=y; m[14]=z; m[15]=1; return m; }
  _matrixMultiply(a,b){ const out=new Float32Array(16); for(let i=0;i<4;i++){ for(let j=0;j<4;j++){ let sum=0; for(let k=0;k<4;k++){ sum += a[k*4 + j] * b[i*4 + k]; } out[i*4 + j]=sum; }} return out; }
}

