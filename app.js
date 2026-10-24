import {remaining, sectorPath, restore} from './timer.js';
const $ = id => document.getElementById(id);
const key = 'hitoiki-timer-v1';
let saved; try {saved = restore(localStorage.getItem(key));} catch {}
let s = saved || {scale:60,minutes:25,mode:'focus',remaining:1500000,running:false,endAt:0,sound:true};
let audio, lock, lastSecond=-1;
function save(){try {localStorage.setItem(key,JSON.stringify(s));} catch {}}
function tell(message){$('announcement').textContent=message;}
function reset(){s.running=false;s.remaining=s.minutes*60000;s.endAt=0;save();tell('');release();render();}
async function wake(){if(!s.running || document.hidden || !navigator.wakeLock)return;try {lock=await navigator.wakeLock.request('screen');} catch {}}
function release(){if(lock){lock.release().catch(()=>{});lock=null;}}
function unlockAudio(){try{audio ||= new (window.AudioContext || window.webkitAudioContext)();audio.resume().catch(()=>{});}catch{}}
function chime(){if(!s.sound || !audio)return;try{[0,.3,.6].forEach((delay,i)=>{const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.value=[659,784,988][i];gain.gain.setValueAtTime(0,audio.currentTime+delay);gain.gain.linearRampToValueAtTime(.18,audio.currentTime+delay+.02);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+delay+.7);osc.connect(gain);gain.connect(audio.destination);osc.start(audio.currentTime+delay);osc.stop(audio.currentTime+delay+.8);});}catch{}}
function drawScale(){lastSecond=-1;let ticks='',labels='';for(let i=0;i<60;i++){const a=i*Math.PI/30,r=i%5===0?153:156;ticks+=`<line class="${i%5===0?'major':''}" x1="${200+r*Math.sin(a)}" y1="${200-r*Math.cos(a)}" x2="${200+161*Math.sin(a)}" y2="${200-161*Math.cos(a)}"/>`;}const divisions=s.scale===30||s.scale===90?6:12;for(let i=0;i<divisions;i++){const a=i*2*Math.PI/divisions;labels+=`<text x="${200+177*Math.sin(a)}" y="${200-177*Math.cos(a)}">${i===0?0:s.scale*i/divisions}</text>`;}$('ticks').innerHTML=ticks;$('labels').innerHTML=labels;}
function render(){const ms=remaining(s),seconds=Math.ceil(ms/1000),min=Math.floor(seconds/60),sec=seconds%60;const fraction=ms/(s.scale*60000);$('sector').setAttribute('d',sectorPath(fraction));$('hand').setAttribute('x2',200+148*Math.sin(fraction*Math.PI*2));$('hand').setAttribute('y2',200-148*Math.cos(fraction*Math.PI*2));if(seconds!==lastSecond){$('time').innerHTML=`${String(min).padStart(2,'0')}<span>:</span>${String(sec).padStart(2,'0')}`;document.title=`${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')} · ひと息`;$('clock').setAttribute('aria-label',`${s.scale}分の時計、残り${min}分${sec}秒`);lastSecond=seconds;}
 document.querySelector('.clock-caption').childNodes[1].textContent=s.mode==='break'?'緑の面積が、残りの時間 ':'赤い面積が、残りの時間 ';document.body.classList.toggle('running',s.running);document.body.classList.toggle('break',s.mode==='break');$('scale').value=s.scale;$('scale-caption').textContent=s.scale;$('minutes').max=s.scale;
 const active=s.running || (ms>0 && ms<s.minutes*60000);document.querySelectorAll('[data-mode],[data-minutes],#minutes,#scale').forEach(el=>el.disabled=active);
 document.querySelectorAll('[data-mode]').forEach(el=>el.setAttribute('aria-pressed',el.dataset.mode===s.mode));document.querySelectorAll('[data-minutes]').forEach(el=>{el.setAttribute('aria-pressed',Number(el.dataset.minutes)===s.minutes);el.disabled=active||Number(el.dataset.minutes)>s.scale;});
 $('status').textContent=s.running?(s.mode==='focus'?'ひとつのことに、集中。':'ゆっくり、ひと休み。'):ms===0?'おつかれさまでした':active?'一時停止中':'集中する準備はできましたか';
 $('start').innerHTML=s.running?'Ⅱ<span>一時停止</span>':`▶<span>${ms===0?'もう一度':active?'再開する':'はじめる'}</span>`;
 $('finish').textContent=s.running?`${new Date(s.endAt).toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})} に終了予定`:ms===0?(s.mode==='focus'?'集中できました。ひと休みしましょう。':'休憩できました。次の集中へ。'):`${s.minutes}分間、自分のペースで。`;
 $('sound').setAttribute('aria-pressed',!!s.sound);$('sound').setAttribute('aria-label',s.sound?'終了音を切る':'終了音を入れる');$('sound').innerHTML=`♪<span>音 ${s.sound?'ON':'OFF'}</span>`;
}
function tick(){if(s.running&&remaining(s)<=0){s.running=false;s.remaining=0;s.endAt=0;save();release();chime();tell(s.mode==='focus'?'時間です。おつかれさまでした！':'休憩が終わりました。');}render();}
$('start').addEventListener('click',()=>{unlockAudio();if(s.running){s.remaining=remaining(s);s.running=false;release();}else{if(s.remaining<=0)s.remaining=s.minutes*60000;s.endAt=Date.now()+s.remaining;s.running=true;wake();}tell('');save();render();});
$('reset').addEventListener('click',reset);
$('sound').addEventListener('click',()=>{s.sound=!s.sound;if(s.sound)unlockAudio();save();render();});
function setMinutes(value){if(!Number.isInteger(value)||value<1||value>s.scale){$('minutes').value=s.minutes;tell(`1〜${s.scale}分の整数で設定してください。`);return;}s.minutes=value;$('minutes').value=value;reset();}
$('minutes').addEventListener('change',e=>setMinutes(Number(e.target.value)));
$('scale').addEventListener('change',e=>{s.scale=Number(e.target.value);s.minutes=Math.min(s.minutes,s.scale);$('minutes').value=s.minutes;drawScale();reset();});
document.querySelectorAll('[data-minutes]').forEach(el=>el.addEventListener('click',()=>setMinutes(Number(el.dataset.minutes))));
document.querySelectorAll('[data-mode]').forEach(el=>el.addEventListener('click',()=>{s.mode=el.dataset.mode;const values=s.mode==='focus'?[15,25,50]:[5,10,15];document.querySelectorAll('[data-minutes]').forEach((b,i)=>{b.dataset.minutes=values[i];b.textContent=values[i]+'分';});setMinutes(s.mode==='focus'?25:5);}));
document.addEventListener('visibilitychange',()=>{tick();if(!document.hidden)wake();});
window.addEventListener('pageshow',tick);window.addEventListener('pagehide',save);
$('minutes').value=s.minutes;if(s.mode==='break')document.querySelectorAll('[data-minutes]').forEach((b,i)=>{b.dataset.minutes=[5,10,15][i];b.textContent=b.dataset.minutes+'分';});
drawScale();tick();wake();setInterval(tick,200);
