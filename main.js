const videoPeople=[['Dad','dad.mp4','🧔'],['Mom','mom.mp4','💗'],['Sister','sister.mp4','🌸'],['Marija','marija.mp4','💫'],['Tėja','teja.mp4','🌙'],['Grandma','grandma.mp4','🌼'],['Indraja','indraja.mp4','✨']];
// Add another greeting by adding an entry above, for example ['Friend','friend.mp4','💌'].
const KEY='kotryna-18-progress-v2';const state=JSON.parse(localStorage.getItem(KEY)||'{}');function save(){localStorage.setItem(KEY,JSON.stringify(state))}function setDone(k){state[k]=true;save();document.querySelectorAll('[data-achievement]').forEach(x=>{x.textContent=state[x.dataset.achievement]?'✓ Completed':'Not yet completed'})}function notice(s){const el=document.getElementById('notice');if(el){el.textContent=s;el.hidden=false}}
function photoFallback(img){const stem=img.dataset.stem;const ext=['jpeg','jpg','png','webp'];let i=Number(img.dataset.try||0);if(i<ext.length-1){i++;img.dataset.try=i;img.src=stem+'.'+ext[i]}else{img.hidden=true;img.parentElement.querySelector('.photo-fallback').hidden=false}}
function makePhotos(){const target=document.getElementById('photos');if(!target)return;for(let i=1;i<=18;i++){let c=document.createElement('article');c.className='card photo-card';c.innerHTML=`<div class="photo-frame"><div class="photo-fallback" hidden><strong>${i}</strong> Add photo-age${i}.jpeg</div><img src="photo-age${i}.jpeg" data-stem="photo-age${i}" onerror="photoFallback(this)" alt="Kotryna at age ${i}" loading="lazy"></div><h3>Chapter ${i}</h3><span class="tag">Age ${i}</span>`;target.append(c)}setDone('journey')}
function makeVideos(){const target=document.getElementById('videos');if(!target)return;for(const [name,file,emoji] of videoPeople){const c=document.createElement('article');c.className='panel video-card';c.innerHTML=`<div class="eyebrow">A special message</div><h3>${emoji} ${name}</h3><video controls playsinline preload="none"><source src="${file}" type="video/mp4">Your browser cannot play this video.</video><div class="video-missing" hidden><div><b>🎬</b> Add <code>${file}</code> beside the HTML files</div></div>`;const vid=c.querySelector('video');vid.addEventListener('error',()=>{vid.hidden=true;c.querySelector('.video-missing').hidden=false});vid.querySelector('source').addEventListener('error',()=>{vid.hidden=true;c.querySelector('.video-missing').hidden=false});target.append(c)}setDone('voices')}
function initMusic(){
  const btn=document.getElementById('musicBtn'),audio=document.getElementById('birthdayAudio');
  if(!btn||!audio)return;
  if(new URLSearchParams(window.location.search).has('embedded')){
    const musicbox=document.querySelector('.musicbox');
    if(musicbox) musicbox.hidden=true;
    audio.removeAttribute('autoplay');
    audio.pause();
    return;
  }
  let stoppedByUser=false;
  const syncButton=()=>{btn.textContent=audio.paused?'♫ Play music':'⏸ Pause music'};
  async function tryStart(){
    if(stoppedByUser||!audio.paused)return;
    try { await audio.play(); syncButton(); clearTriggers(); }
    catch(e) { syncButton(); } // Browser may block unmuted autoplay.
  }
  const events=['pointerdown','keydown','touchstart'];
  function clearTriggers(){events.forEach(event=>document.removeEventListener(event,onInteraction,true));}
  function onInteraction(e){
    if(e.target===btn || btn.contains(e.target))return;
    tryStart();
  }
  events.forEach(event=>document.addEventListener(event,onInteraction,true));
  btn.addEventListener('click',async()=>{
    if(audio.paused){stoppedByUser=false;try{await audio.play();syncButton();clearTriggers()}catch(e){notice('Music cannot start automatically here. Please tap Play music.')}}
    else{stoppedByUser=true;audio.pause();syncButton()}
  });
  audio.addEventListener('play',syncButton);
  audio.addEventListener('pause',syncButton);
  audio.addEventListener('error',()=>{btn.title='Check that birthday-music.mp3 is beside journey.html'});
  tryStart();
}
function initGame(){const arena=document.getElementById('gameArea');if(!arena)return;let count=Number(state.stars||0);const out=document.getElementById('count'),bar=document.getElementById('starBar');function paint(){out.textContent=count;bar.style.width=count/18*100+'%';if(count>=18){setDone('stars');notice('Quest complete! You collected all 18 starlight wishes. ✨')}}paint();function spawn(){arena.innerHTML='';if(count>=18){arena.innerHTML='<div style="display:grid;place-items:center;height:100%;text-align:center;font-size:25px">✦ All 18 stars collected! ✦<br>Quest complete 🐈</div>';return}for(let i=0;i<Math.min(5,18-count);i++){let b=document.createElement('button');b.className='star';b.textContent=['✦','⭐','✧'][i%3];b.setAttribute('aria-label','Collect a star');b.style.left=(8+Math.random()*82)+'%';b.style.top=(8+Math.random()*75)+'%';b.onclick=()=>{count++;state.stars=count;save();paint();spawn()};arena.append(b)}}spawn();document.getElementById('resetStars').onclick=()=>{count=0;state.stars=0;state.starsDone=false;save();paint();spawn()};let pets=Number(state.pets||0);const p=document.getElementById('petCount');p.textContent=pets;document.getElementById('petCat').onclick=()=>{pets++;state.pets=pets;save();p.textContent=pets;if(pets>=18){setDone('cats');notice('Purrfect! You earned the Cat Guardian badge. 🐈')}}}
function initPuzzle(){const box=document.getElementById('puzzles');if(!box)return;const qs=[{q:'Which element pairs with Pyro for a Vaporize reaction?',a:['Hydro','Geo','Anemo'],ok:0},{q:'What lets you quickly move between discovered points on the map?',a:['Teleport Waypoints','Cooking pots','Treasure chests'],ok:0},{q:'What is Kotryna unlocking today?',a:['A new Adventure Rank','Her 18th birthday chapter','An ordinary Tuesday'],ok:1}];let idx=Number(state.quizIndex||0);function render(){if(idx>=qs.length){box.innerHTML='<h3>✧ Elemental Trial complete!</h3><p>All answers cleared. Your next adventure is waiting.</p>';setDone('quiz');return}let q=qs[idx];box.innerHTML=`<div class="eyebrow">Trial ${idx+1} / ${qs.length}</div><h3>${q.q}</h3><div class="quiz-options"></div>`;q.a.forEach((a,i)=>{const b=document.createElement('button');b.className='choice';b.textContent=a;b.onclick=()=>{if(i===q.ok){b.classList.add('correct');setTimeout(()=>{idx++;state.quizIndex=idx;save();render()},350)}else{b.classList.add('wrong');setTimeout(()=>b.classList.remove('wrong'),650)}};box.querySelector('.quiz-options').append(b)})}render()}
function initFinale(){const btn=document.getElementById('rewardBtn');if(!btn)return;btn.onclick=()=>{document.getElementById('reward').classList.add('show');setDone('finale');document.getElementById('reward').scrollIntoView({behavior:'smooth'})};const s=['stars','cats','quiz'];document.getElementById('completedQuests').textContent=s.filter(x=>state[x]).length+' / 3';}
document.addEventListener('DOMContentLoaded',()=>{const b=document.querySelector('.menuBtn');b?.addEventListener('click',()=>document.querySelector('.links').classList.toggle('open'));makePhotos();makeVideos();initMusic();initGame();initPuzzle();initFinale();document.querySelectorAll('[data-achievement]').forEach(x=>x.textContent=state[x.dataset.achievement]?'✓ Completed':'Not yet completed')});
