const path=require('node:path'),base=path.resolve(__dirname,'..');
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const playerCode=fs.readFileSync(path.join(base,'Tests/Player.js'),'utf8');
const contextCode=fs.readFileSync(path.join(base,'Source/panorama/scripts/gurrenlock_preview_context.js'),'utf8');
const previewCode=fs.readFileSync(path.join(base,'Source/panorama/scripts/gurrenlock_preview.js'),'utf8');
let clock=0,queue=[],created=[],logs=[],context;
function panel(id){return {id,visible:true,valid:true,style:{},attributes:{},SetAttributeString(k,v){this.attributes[k]=v},GetAttributeString(k,d){return this.attributes[k]===undefined?d:this.attributes[k]},GetChildCount(){return 0},GetChild(){return null},classes:new Set(),events:{},IsValid(){return this.valid},BHasClass(c){return this.classes.has(c)},AddClass(c){this.classes.add(c)},RemoveClass(c){this.classes.delete(c)},GetParent(){return this.parent||null},FindChildTraverse(){return null},SetPanelEvent(n,fn){this.events[n]=fn},DeleteAsync(){this.valid=false}}}
const ids={};for(const id of ['GurrenLockPreviewWindow','GurrenLockPreviewOpen','GurrenLockPreviewRestart','GurrenLockPreviewClose','GurrenLockPreviewPrevious','GurrenLockPreviewNext','GurrenLockPreviewHero'])ids[id]=panel(id);
const window=ids.GurrenLockPreviewWindow;window.visible=true; // Reproduce ignored XML visibility on native mount.
const host=panel('GurrenLockMovieHost');host.visible=false;
const root=panel('GurrenLockPreviewStage');root.parent=window;root.actuallayoutwidth=1920;root.actuallayoutheight=1080;root.AddClass('State_HeroReveal');root.AddClass('HeroLoaded');root.FindChildTraverse=id=>id==='GurrenLockMovieHost'?host:null;ids[root.id]=root;
const hud=panel('HUD');hud.FindChildTraverse=id=>ids[id]||null;
const $={GetContextPanel:()=>context,Msg:m=>logs.push(m),Schedule:(t,fn)=>queue.push({at:clock+t,fn}),RegisterEventHandler:(n,p,fn)=>p.events[n]=fn,CreatePanel:(type,parent,id,attrs)=>{const p=panel(id);p.type=type;p.attrs=attrs;p.parent=parent;p.SetRepeat=()=>{};p.SetPlaybackVolume=()=>{};created.push(p);return p}};
context=root;vm.runInNewContext(contextCode,{$});vm.runInNewContext(playerCode,{$});context=hud;vm.runInNewContext(previewCode,{$});
function advance(t){const end=clock+t;let n=0;while(true){queue.sort((a,b)=>a.at-b.at);if(!queue.length||queue[0].at>end)break;const e=queue.shift();clock=e.at;e.fn();assert.ok(++n<100000)}clock=end}
const click=id=>ids[id].events.onactivate();const movies=()=>created.filter(p=>p.type==='Movie');
advance(1);assert.equal(movies().length,0);assert.equal(window.visible,false,'startup must be closed even if XML visibility is ignored');assert.equal(window.BHasClass('GurrenLockPreviewExpanded'),false);assert.equal(hud.FindChildTraverse('GurrenLockPreviewRoot'),null,'source root ID does not survive native mount');click('GurrenLockPreviewOpen');advance(1);assert.equal(window.visible,true);assert.equal(window.BHasClass('GurrenLockPreviewExpanded'),true);assert.equal(movies().length,1);assert.ok(movies()[0].attrs.src.endsWith('/Abrams.webm'));assert.equal(host.visible,true);
advance(9);assert.equal(movies()[0].valid,false);let last=created.filter(p=>p.type==='Image').at(-1);assert.equal(last.style.opacity,'1');advance(60);assert.equal(window.visible,true);assert.equal(host.visible,true);assert.equal(last.valid,true);assert.equal(movies().length,1);
click('GurrenLockPreviewRestart');advance(1);assert.equal(movies().length,2);assert.equal(last.valid,false);
click('GurrenLockPreviewNext');click('GurrenLockPreviewNext');advance(1);assert.ok(movies().at(-1).attrs.src.endsWith('/Baba.webm'));assert.equal(ids.GurrenLockPreviewHero.text,'Baba');
click('GurrenLockPreviewPrevious');advance(1);assert.ok(movies().at(-1).attrs.src.endsWith('/Apollo.webm'));
const playing=movies().at(-1);click('GurrenLockPreviewClose');advance(.5);assert.equal(window.visible,false);assert.equal(playing.valid,false);assert.equal(host.visible,false);
click('GurrenLockPreviewOpen');click('GurrenLockPreviewClose');advance(1);assert.equal(window.visible,false);assert.equal(host.visible,false);
root.SetAttributeString('gurrenlock_preview_player','');const before=movies().length;
click('GurrenLockPreviewOpen');advance(4);assert.equal(window.visible,false);assert.equal(movies().length,before,'missing context must not open black blocker');
root.SetAttributeString('gurrenlock_preview_player','ready');click('GurrenLockPreviewOpen');advance(1);assert.equal(window.visible,true);assert.equal(movies().length,before+1,'reopens after delayed registration');
click('GurrenLockPreviewClose');advance(.5);assert.equal(window.BHasClass('GurrenLockPreviewExpanded'),false);
root.valid=false;hud.valid=false;advance(1);
console.log('PASS: native Stage ID, closed startup, missing context, reopen; preview uses production player, holds final frame 60s past EOF, restarts, navigates heroes, cleans audio/video and ignores stale clicks.');
