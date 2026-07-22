'use strict';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id);
const ui={menu:$('menu'),pause:$('pause'),message:$('message'),hud:$('hud'),bossHud:$('bossHud'),bossBar:$('bossBar'),bossName:$('bossName'),heroName:$('heroName'),lives:$('lives'),bones:$('bones'),score:$('score'),level:$('level'),messageTitle:$('messageTitle'),messageText:$('messageText')};
const A={};['armani_idle','armani_run','armani_jump','armani_attack','chanel_run','enemy_cat','enemy_mouse','enemy_lion','enemy_lion_strong','lion_boss_idle','lion_boss_swipe','lion_boss_roar','lion_boss_defeated','bear_king'].forEach(n=>{let i=new Image;i.src=`assets/${n}.${n==='bear_king'?'svg':'png'}`;A[n]=i});
let mode='menu',difficulty='normal',levelIndex=0,score=0,bones=0,lives=4,last=0,shake=0,saveKey='ca_v16_hd_save';
const keys={left:false,right:false,jump:false};
const physics={gravity:1900,run:360,jump:760};
const worlds=[
 {name:'Wiesenwelt',sky:['#48b9ff','#d8f4ff'],length:5200,boss:false},
 {name:'Sonnenland',sky:['#ff9e52','#ffdcb6'],length:5600,boss:false},
 {name:'Königsfestung',sky:['#35165e','#dc5579'],length:4700,boss:true}
];
let player,platforms,enemies,pipes,items,particles,boss,cameraX,checkpoint;
function rectHit(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function resetPlayer(){player={x:120,y:420,w:72,h:88,vx:0,vy:0,onGround:false,hero:'chanel',inv:0,anim:0,face:1};checkpoint=120}
function buildLevel(){const w=worlds[levelIndex];cameraX=0;platforms=[];enemies=[];pipes=[];items=[];particles=[];boss=null;resetPlayer();
 platforms.push({x:0,y:610,w:w.length,h:110,type:'ground'});
 for(let x=450;x<w.length-500;x+=420){if((x/420)%3!==0)platforms.push({x,y:460-(x%840?0:90),w:220,h:36,type:'brick'});}
 for(let x=300;x<w.length-700;x+=360){items.push({x,y:390-(x%720?0:90),w:26,h:26,type:'bone',got:false,spin:0});}
 [850,1800,2950,3850].forEach((x,i)=>{pipes.push({x,y:510-(i%2)*70,w:110,h:100+(i%2)*70,timer:1.5+i*.7,spawned:false});});
 const types=['mouse','cat','lion'];for(let x=650,i=0;x<w.length-900;x+=520,i++){enemies.push(makeEnemy(types[i%3],x,platformYAt(x)-58));}
 if(w.boss){const hp=difficulty==='hard'?12:difficulty==='easy'?7:9;boss={type:difficulty==='hard'?'bear':'lion',x:w.length-720,y:305,w:300,h:300,vx:0,vy:0,hp,maxHp:hp,state:'idle',timer:1.8,onGround:true,dead:false,phase:1};}
 updateHud();mode='play';ui.menu.classList.remove('show');ui.pause.classList.remove('show');ui.message.classList.remove('show');ui.bossHud.classList.remove('show');}
function platformYAt(x){let y=610;for(const p of platforms)if(x>=p.x&&x<=p.x+p.w&&p.y<y)y=p.y;return y}
function makeEnemy(type,x,y){let s=type==='mouse'?50:type==='cat'?64:82;return{type,x,y,w:s,h:s,vx:(type==='mouse'?75:type==='cat'?105:85)*(Math.random()<.5?-1:1),vy:0,dead:false,onGround:false,anim:Math.random()*5};}
function showMessage(title,text,button='WEITER'){mode='message';ui.messageTitle.textContent=title;ui.messageText.textContent=text;$('messageBtn').textContent=button;ui.message.classList.add('show')}
function updateHud(){ui.heroName.textContent=player?.hero==='chanel'?'CHANEL':'ARMANI';ui.lives.textContent=lives;ui.bones.textContent=bones;ui.score.textContent=score;ui.level.textContent=`1-${levelIndex+1}`}
function damage(){if(player.inv>0)return;lives--;player.inv=2;player.vy=-520;player.vx=-player.face*250;shake=10;updateHud();if(lives<=0){showMessage('NOCH EIN VERSUCH','Chanel und Armani geben nicht auf!','LEVEL NEU STARTEN');}}
function stomp(e){e.dead=true;player.vy=-500;score+=100;burst(e.x+e.w/2,e.y+e.h/2,'#ffd43b',14);updateHud()}
function burst(x,y,c,n){for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*400,vy:-Math.random()*450,life:.8+Math.random()*.5,c,s:4+Math.random()*7})}
function update(dt){if(mode!=='play')return;const w=worlds[levelIndex];player.inv=Math.max(0,player.inv-dt);player.anim+=dt*8;
 player.vx=(keys.right-keys.left)*physics.run;if(player.vx)player.face=Math.sign(player.vx);
 if(keys.jump&&player.onGround){player.vy=-physics.jump;player.onGround=false;keys.jump=false;burst(player.x+36,player.y+86,'#fff',6)}
 player.vy+=physics.gravity*dt;player.x+=player.vx*dt;player.y+=player.vy*dt;player.x=clamp(player.x,0,w.length-player.w);player.onGround=false;
 for(const p of [...platforms,...pipes]){const r={x:p.x,y:p.y,w:p.w,h:p.h};if(rectHit(player,r)&&player.vy>=0&&player.y+player.h-player.vy*dt<=p.y+12){player.y=p.y-player.h;player.vy=0;player.onGround=true;}}
 if(player.y>760){player.x=checkpoint;player.y=300;damage()}
 for(const item of items){item.spin+=dt*6;if(!item.got&&rectHit(player,item)){item.got=true;bones++;score+=50;burst(item.x,item.y,'#fff27a',9);updateHud()}}
 for(const p of pipes){p.timer-=dt;if(p.timer<=0&&!p.spawned&&Math.abs(player.x-p.x)<700){p.spawned=true;p.timer=5+Math.random()*4;const e=makeEnemy('rabbit',p.x+25,p.y-30);e.vy=-650;e.vx=(Math.random()<.5?-1:1)*130;enemies.push(e)}else if(p.timer<=0&&p.spawned){p.spawned=false;p.timer=2+Math.random()*3}}
 for(const e of enemies){if(e.dead)continue;e.anim+=dt*7;e.vy+=physics.gravity*dt;e.x+=e.vx*dt;e.y+=e.vy*dt;e.onGround=false;for(const p of platforms){if(rectHit(e,p)&&e.vy>=0&&e.y+e.h-e.vy*dt<=p.y+12){e.y=p.y-e.h;e.vy=0;e.onGround=true}}
  if(e.x<0||e.x>w.length-e.w)e.vx*=-1;if(e.type==='rabbit'&&e.onGround&&Math.random()<.01)e.vy=-550;
  if(rectHit(player,e)){if(player.vy>120&&player.y+player.h<e.y+e.h*.55)stomp(e);else damage()}}
 if(boss&&!boss.dead)updateBoss(dt);
 for(const p of particles){p.life-=dt;p.vy+=900*dt;p.x+=p.vx*dt;p.y+=p.vy*dt}particles=particles.filter(p=>p.life>0);
 cameraX=clamp(player.x-360,0,w.length-canvas.width);if(player.x>w.length-430&&!w.boss){checkpoint=player.x;levelIndex++;localStorage.setItem(saveKey,JSON.stringify({levelIndex,score,bones,lives,difficulty}));showMessage('LEVEL GESCHAFFT!',`${worlds[levelIndex-1].name} ist geschafft. Weiter geht die Reise!`)}
}
function updateBoss(dt){const b=boss;ui.bossHud.classList.add('show');ui.bossName.textContent=b.type==='bear'?'BÄRENKÖNIG – HAUPTBOSS':'LÖWENKÖNIG';ui.bossBar.style.width=`${b.hp/b.maxHp*100}%`;b.timer-=dt;b.anim=(b.anim||0)+dt*5;
 if(b.state==='idle'){b.vx=(player.x<b.x?-1:1)*65;if(b.timer<=0){const r=Math.random();b.state=r<.34?'swipe':r<.68?'jump':'shock';b.timer=b.state==='swipe'?.8:b.state==='jump'?1.5:1.2}}
 else if(b.state==='swipe'){b.vx=0;if(b.timer<.45&&Math.abs(player.x-b.x)<250)damage();if(b.timer<=0){b.state='idle';b.timer=1.2}}
 else if(b.state==='jump'){if(b.onGround&&b.timer>1){b.vy=-900;b.vx=(player.x-b.x)*.8;b.onGround=false}if(b.timer<=0){b.state='idle';b.timer=1;shockwave(b.x+b.w/2,b.y+b.h)}}
 else if(b.state==='shock'){b.vx=0;if(b.timer<.8&&b.timer>.7)shockwave(b.x+b.w/2,b.y+b.h);if(b.timer<=0){b.state='idle';b.timer=1.3}}
 b.vy+=physics.gravity*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;const gy=610-b.h;if(b.y>=gy){if(!b.onGround&&b.vy>500){shake=18;burst(b.x+b.w/2,610,'#d9b16f',22)}b.y=gy;b.vy=0;b.onGround=true}
 if(rectHit(player,b)){if(player.vy>160&&player.y+player.h<b.y+110){b.hp--;player.vy=-650;score+=500;shake=12;burst(b.x+b.w/2,b.y+60,'#ffda3b',24);if(b.hp<=0){b.dead=true;ui.bossHud.classList.remove('show');score+=5000;localStorage.removeItem(saveKey);showMessage('DAS KÖNIGREICH IST GERETTET!',difficulty==='hard'?'Der Bärenkönig ist besiegt. Chanel und Armani sind die Helden der Weltreise!':'Der Löwenkönig ist besiegt. Versuche jetzt „Schwer“ für den Bärenkönig!','ZUM TITELBILD')}else{b.phase=1+Math.floor((1-b.hp/b.maxHp)*3);b.timer=Math.max(.55,1.4-b.phase*.2)}}else damage()}
}
function shockwave(x,y){shake=14;particles.push({wave:true,x,y,life:.75,r:10,c:'#fff3a6'});if(Math.abs((player.x+36)-x)<390&&player.onGround)damage()}
function draw(){const w=worlds[levelIndex]||worlds[0];const sx=shake?(Math.random()-.5)*shake:0,sy=shake?(Math.random()-.5)*shake:0;shake*=.88;ctx.save();ctx.translate(sx,sy);drawBackground(w);ctx.save();ctx.translate(-cameraX,0);drawWorld(w);ctx.restore();ctx.restore()}
function drawBackground(w){const g=ctx.createLinearGradient(0,0,0,720);g.addColorStop(0,w.sky[0]);g.addColorStop(1,w.sky[1]);ctx.fillStyle=g;ctx.fillRect(0,0,1280,720);
 for(let i=0;i<7;i++){let x=((i*260-cameraX*.15)%1700+1700)%1700-200,y=120+(i%3)*75;ctx.fillStyle='#fff9';ctx.beginPath();ctx.arc(x,y,45,0,7);ctx.arc(x+45,y-15,55,0,7);ctx.arc(x+95,y,42,0,7);ctx.fill()}
 for(let layer=0;layer<2;layer++){ctx.fillStyle=layer?'#3eaa62':'#58c77a';ctx.beginPath();ctx.moveTo(0,610);for(let x=0;x<=1280;x+=160){let y=420+layer*70+Math.sin((x+cameraX*(.08+layer*.05))/230)*70;ctx.quadraticCurveTo(x+80,y-100,x+160,610)}ctx.closePath();ctx.fill()}}
function drawWorld(w){for(const p of platforms)drawPlatform(p);for(const p of pipes)drawPipe(p);for(const i of items)if(!i.got)drawBone(i);for(const e of enemies)if(!e.dead)drawEnemy(e);if(boss)drawBoss(boss);drawPlayer();for(const p of particles)drawParticle(p);}
function drawPlatform(p){if(p.type==='ground'){ctx.fillStyle='#48a934';ctx.fillRect(p.x,p.y,p.w,15);ctx.fillStyle='#9a4d1d';ctx.fillRect(p.x,p.y+15,p.w,p.h-15);for(let x=p.x;x<p.x+p.w;x+=48){ctx.strokeStyle='#56270e';ctx.strokeRect(x,p.y+15,48,45)}}else{for(let x=p.x;x<p.x+p.w;x+=55){const gr=ctx.createLinearGradient(0,p.y,0,p.y+36);gr.addColorStop(0,'#f08a2d');gr.addColorStop(1,'#8a300d');ctx.fillStyle=gr;ctx.fillRect(x,p.y,52,34);ctx.strokeStyle='#52200b';ctx.lineWidth=4;ctx.strokeRect(x,p.y,52,34)}}}
function drawPipe(p){const g=ctx.createLinearGradient(p.x,0,p.x+p.w,0);g.addColorStop(0,'#0d7b26');g.addColorStop(.35,'#44e35c');g.addColorStop(.65,'#149331');g.addColorStop(1,'#07591a');ctx.fillStyle=g;ctx.fillRect(p.x+12,p.y,p.w-24,p.h);ctx.fillRect(p.x,p.y,p.w,30);ctx.strokeStyle='#064a16';ctx.lineWidth=6;ctx.strokeRect(p.x,p.y,p.w,30);ctx.strokeRect(p.x+12,p.y+30,p.w-24,p.h-30)}
function drawBone(i){ctx.save();ctx.translate(i.x+13,i.y+13);ctx.rotate(Math.sin(i.spin)*.2);ctx.fillStyle='#fff3c4';ctx.strokeStyle='#9b7d4b';ctx.lineWidth=3;ctx.fillRect(-14,-6,28,12);for(const x of[-15,15])for(const y of[-7,7]){ctx.beginPath();ctx.arc(x,y,7,0,7);ctx.fill();ctx.stroke()}ctx.restore()}
function drawImageFit(img,x,y,w,h,flip=false){if(!img.complete)return;ctx.save();if(flip){ctx.translate(x+w,y);ctx.scale(-1,1);ctx.drawImage(img,0,0,w,h)}else ctx.drawImage(img,x,y,w,h);ctx.restore()}
function drawPlayer(){if(player.inv>0&&Math.floor(player.inv*12)%2)return;let img=player.hero==='chanel'?A.chanel_run:(player.onGround?A.armani_run:A.armani_jump);drawImageFit(img,player.x-18,player.y-15,player.w+36,player.h+24,player.face<0)}
function drawEnemy(e){let img=e.type==='mouse'?A.enemy_mouse:e.type==='cat'?A.enemy_cat:e.type==='lion'?A.enemy_lion:null;if(e.type==='rabbit'){drawImageFit(A.enemy_mouse,e.x,e.y,e.w,e.h,e.vx<0);ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(e.x+e.w*.5,e.y+e.h*.4,e.w*.45,e.h*.55,0,0,7);ctx.fill();return}drawImageFit(img,e.x-8,e.y-10,e.w+16,e.h+16,e.vx<0)}
function drawBoss(b){if(b.dead){if(b.type==='lion')drawImageFit(A.lion_boss_defeated,b.x,b.y+80,b.w,b.h-80);return}if(b.type==='bear'){drawImageFit(A.bear_king,b.x,b.y,b.w,b.h,b.vx<0)}else{let img=b.state==='swipe'?A.lion_boss_swipe:b.state==='shock'?A.lion_boss_roar:A.lion_boss_idle;drawImageFit(img,b.x,b.y,b.w,b.h,b.vx<0)}}
function drawParticle(p){ctx.save();ctx.globalAlpha=clamp(p.life,0,1);if(p.wave){ctx.strokeStyle=p.c;ctx.lineWidth=12;ctx.beginPath();ctx.ellipse(p.x,p.y,p.r+(1-p.life)*500,25,0,0,7);ctx.stroke()}else{ctx.fillStyle=p.c;ctx.fillRect(p.x,p.y,p.s,p.s)}ctx.restore()}
function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop)}requestAnimationFrame(loop);
function bindHold(id,key){const el=$(id);const on=e=>{e.preventDefault();keys[key]=true};const off=e=>{e.preventDefault();keys[key]=false};['pointerdown','touchstart'].forEach(n=>el.addEventListener(n,on,{passive:false}));['pointerup','pointercancel','pointerleave','touchend'].forEach(n=>el.addEventListener(n,off,{passive:false}))}
bindHold('left','left');bindHold('right','right');$('jump').addEventListener('pointerdown',e=>{e.preventDefault();keys.jump=true});$('switch').onclick=()=>{if(player){player.hero=player.hero==='chanel'?'armani':'chanel';updateHud();burst(player.x+36,player.y+40,'#79c9ff',12)}};
addEventListener('keydown',e=>{if(['ArrowLeft','a','A'].includes(e.key))keys.left=true;if(['ArrowRight','d','D'].includes(e.key))keys.right=true;if(['ArrowUp','w','W',' '].includes(e.key)){keys.jump=true;e.preventDefault()}if(['f','F'].includes(e.key))$('switch').click();if(e.key==='Escape')togglePause()});addEventListener('keyup',e=>{if(['ArrowLeft','a','A'].includes(e.key))keys.left=false;if(['ArrowRight','d','D'].includes(e.key))keys.right=false});
document.querySelectorAll('[data-diff]').forEach(b=>b.onclick=()=>{difficulty=b.dataset.diff;document.querySelectorAll('[data-diff]').forEach(x=>x.classList.toggle('selected',x===b));});
$('start').onclick=()=>{levelIndex=0;score=0;bones=0;lives=difficulty==='easy'?5:difficulty==='hard'?3:4;buildLevel()};
$('continue').onclick=()=>{try{const s=JSON.parse(localStorage.getItem(saveKey));if(!s)throw 0;Object.assign(window,s);levelIndex=s.levelIndex;score=s.score;bones=s.bones;lives=s.lives;difficulty=s.difficulty;buildLevel()}catch{showMessage('KEIN SPIELSTAND','Starte zuerst eine neue Reise.','ZURÜCK')}};
function togglePause(){if(mode==='play'){mode='pause';ui.pause.classList.add('show')}else if(mode==='pause'){$('resume').click()}}$('pauseBtn').onclick=togglePause;$('resume').onclick=()=>{mode='play';ui.pause.classList.remove('show')};$('restart').onclick=()=>buildLevel();$('home').onclick=()=>location.reload();
$('messageBtn').onclick=()=>{ui.message.classList.remove('show');if(lives<=0){lives=difficulty==='easy'?5:difficulty==='hard'?3:4;buildLevel()}else if(boss?.dead){location.reload()}else if(mode==='message'&&levelIndex<worlds.length){buildLevel()}else{mode='menu';ui.menu.classList.add('show')}};
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
