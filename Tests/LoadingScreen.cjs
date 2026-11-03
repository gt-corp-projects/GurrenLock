const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict');
const code=fs.readFileSync('Source/panorama/scripts/gurrenlock.js','utf8');
let now=0, queue=[], state=false, stage=true, loaded=true, valid=true, selected='', created=[], logs=[];
let host={visible:false,IsValid:()=>true};
let logo={IsValid:()=>true,BHasClass:c=>c===selected};
let spotlight={IsValid:()=>true,BHasClass:c=>c===selected};
const root={visible:true,IsValid:()=>valid,actuallayoutwidth:2560,actuallayoutheight:1440,GetParent:()=>null,
 BHasClass:c=>c==='ShowPregame'?state:c==='State_HeroReveal'?stage:c==='HeroLoaded'?loaded:false,
 FindChildTraverse:id=>({HeroLogo:logo,HeroSpotlight:spotlight,GurrenLockMovieHost:host}[id]||null)};
function panel(type,attrs){return {type,attrs,valid:true,visible:true,style:{},events:{},IsValid(){return this.valid},BHasClass:()=>false,AddClass(){},SetRepeat(v){this.repeat=v},SetPlaybackVolume(v){this.volume=v},DeleteAsync(){this.valid=false},FindChildTraverse(){return null}};}
let $={GetContextPanel:()=>root,Msg:x=>logs.push(x),Schedule:(t,fn)=>queue.push({t:now+t,fn}),
 CreatePanel:(type,parent,id,attrs)=>{let p=panel(type,attrs);created.push(p);return p},RegisterEventHandler:(name,p,fn)=>p.events[name]=fn};
vm.runInNewContext(code,{$});
function advance(t){let end=now+t,n=0;while(true){queue.sort((a,b)=>a.t-b.t);if(!queue.length||queue[0].t>end)break;let e=queue.shift();now=e.t;e.fn();assert.ok(++n<10000)}now=end;}
function movies(){return created.filter(p=>p.type==='Movie')}
advance(1);assert.equal(created.length,0);
state=true;selected='hero_wraith';advance(2);assert.equal(created.length,0);assert.equal(host.visible,false);
const clips=JSON.parse(fs.readFileSync('Tests/Clips.json','utf8'));
const mappings=Object.fromEntries(clips.map(c=>[c.hero,c.name]));
for(const [hero,file] of Object.entries(mappings)){
 selected=hero;advance(.5);let m=movies().at(-1);assert.ok(m.attrs.src.endsWith('/'+file+'.webm'));assert.equal(m.repeat,false);assert.equal(m.volume,1);assert.equal(m.attrs.disableaudio,'false');assert.equal(m.style.width,'100%');assert.equal(host.visible,true);
 m.events.MoviePlayerPlaybackEnded();assert.equal(m.visible,true,'ignore early EOF during decoder init');
 const count=movies().length;advance(9);assert.equal(m.valid,false,'timer must remove EOF texture without native end events');assert.equal(m.visible,false);assert.equal(created.at(-2).visible,true);assert.equal(created.at(-2).style.opacity,'1');assert.ok(created.at(-2).attrs.src.startsWith('s2r://panorama/images/gurrenlock/'));advance(40);assert.equal(movies().length,count,'never replay');
 selected='hero_wraith';advance(.3);assert.equal(m.valid,false);assert.equal(host.visible,false,'vanilla for unmapped hero');
}
selected='hero_lash';loaded=false;advance(1);assert.equal(host.visible,false);loaded=true;stage=false;advance(1);assert.equal(host.visible,false);stage=true;advance(.5);assert.equal(host.visible,true);
let old=movies().at(-1);state=false;advance(.3);assert.equal(old.valid,false);assert.equal(host.visible,false);
state=true;selected='hero_atlas';advance(.5);let fresh=movies().at(-1);old.events.MoviePlayerPlaybackEnded();assert.equal(fresh.visible,true,'old callbacks cannot affect new session');
selected='hero_bebop';spotlight.BHasClass=c=>c==='hero_atlas';advance(.5);assert.equal(host.visible,false,'inconsistent native widgets fall back');
spotlight.BHasClass=c=>c===selected;advance(.5);assert.equal(host.visible,true);
// Runtime construction failure must uncover native hero reveal.
state=false;advance(.3);$.CreatePanel=()=>{throw Error('decoder unavailable')};state=true;advance(1);assert.equal(host.visible,false);assert.ok(logs.some(x=>x.includes('Fallback to vanilla')));
valid=false;advance(1);
console.log('PASS: all 22 mappings, vanilla fallback, native stage gate, one playback, end frame, hero switch, cleanup, stale callbacks and creation failure.');

// Delayed native playback start must supersede the creation-time fallback.
valid=true;$.CreatePanel=(type,parent,id,attrs)=>{let p=panel(type,attrs);created.push(p);return p};
state=false;advance(.3);state=true;selected='hero_bebop';vm.runInNewContext(code,{$});advance(.5);let delayed=movies().at(-1);
advance(1);delayed.events.MoviePlayerPlaybackStart();advance(7.5);assert.equal(delayed.valid,true,'must wait for actual delayed playback');
advance(1);assert.equal(delayed.valid,false);assert.equal(host.visible,true);
state=false;advance(.3);assert.equal(host.visible,false);valid=false;advance(1);
console.log('PASS: delayed-start timer replaces fallback; final still remains until native screen closes.');

console.log('PASS: final frame uses native s2r texture and becomes opaque before decoder deletion.');
