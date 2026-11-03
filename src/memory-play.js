import {littleArt} from './little-play.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/** Picture memory is supported exposure, never a CEFR or vocabulary mastery score. */
export function createMemory(words,offset=0){
 const ids=words.map(w=>w.id),start=Number.isSafeInteger(offset)&&offset>=0?offset%ids.length:0;
 if(new Set(ids).size<3)throw Error('Three accepted pictures required');
 const chosen=[0,1,2].map(n=>ids[(start+n)%ids.length]);
 const cards=[chosen[0],chosen[1],chosen[2],chosen[1],chosen[0],chosen[2]];
 // Stable per round for reloads, with fresh positions for the next picture set.
 let seed=(start+1)*7919;
 if(start)for(let i=cards.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[cards[i],cards[j]]=[cards[j],cards[i]];}
 return{version:1,offset:start,cards,open:[],found:[],turns:0};
}
export function restoreMemory(value,words){
 if(!value||value.version!==1||!Number.isSafeInteger(value.offset)||value.offset<0||value.offset>=words.length)return null;
 const expected=createMemory(words,value.offset);
 if(JSON.stringify(value.cards)!==JSON.stringify(expected.cards)||!Array.isArray(value.open)||value.open.length>2||new Set(value.open).size!==value.open.length||value.open.some(i=>!Number.isInteger(i)||i<0||i>5)||!Array.isArray(value.found)||new Set(value.found).size!==value.found.length||value.found.some(id=>!expected.cards.includes(id))||!Number.isSafeInteger(value.turns)||value.turns<value.found.length||value.turns>10000)return null;
 if(value.open.some(i=>value.found.includes(value.cards[i])))return null;
 if(value.open.length===2&&value.cards[value.open[0]]===value.cards[value.open[1]])return null;
 return{...expected,open:[...value.open],found:[...value.found],turns:value.turns};
}
export function flipMemory(value,index,words){
 const s=restoreMemory(value,words);if(!s)throw Error('Invalid picture game');
 if(!Number.isInteger(index)||index<0||index>5||s.open.includes(index)||s.found.includes(s.cards[index])||s.found.length===3)return s;
 if(s.open.length===2)s.open=[];
 s.open.push(index);
 if(s.open.length===2){s.turns=Math.min(10000,s.turns+1);if(s.cards[s.open[0]]===s.cards[s.open[1]]){s.found.push(s.cards[index]);s.open=[];}}
 return s;
}
export function memoryView({session,words,language='en'}){
 const t=(en,vi)=>language==='vi'?vi:en,s=restoreMemory(session,words);if(!s)return '';
 const complete=s.found.length===3;
 return `<section class="memory-play" data-memory-complete="${complete}"><button class="back-link" data-action="little-open">← ${t('Picture games','Trò chơi với tranh')}</button><div class="memory-heading"><h1>${t('Find the pairs','Lật thẻ tìm đôi')}</h1><span aria-label="${t('Pairs found','Số đôi đã tìm')}">${s.found.length} / 3</span></div><p>${t('Turn over two cards. Find the same picture.','Lật hai thẻ để tìm hai hình giống nhau.')}</p><div class="memory-board">${s.cards.map((id,i)=>{const found=s.found.includes(id),open=found||s.open.includes(i),word=words.find(w=>w.id===id);return `<button class="memory-card ${open?'is-open':''} ${found?'is-found':''}" data-action="memory-flip" data-value="${i}" aria-label="${esc(open?word.word.en+(found?t(', pair found',', đã ghép đôi'):''):t('Turn card '+(i+1),'Lật thẻ '+(i+1)))}" ${found?'disabled':''}>${open?littleArt(id)+`<strong lang="en" translate="no">${esc(word.word.en)}</strong>`:'<span aria-hidden="true">✦</span>'}</button>`;}).join('')}</div><p class="memory-feedback" role="status">${complete?t('All three pairs found!','Bạn đã tìm đủ ba đôi!'):s.open.length===2?t('Different pictures. Try another card.','Hai hình khác nhau rồi. Thử lật thẻ khác nhé.'):s.open.length===1?t('Now turn one more card.','Lật thêm một thẻ nữa nhé.'):s.found.length?t('A pair! Find another one.','Đúng một đôi rồi! Tìm đôi tiếp theo nhé.'):t('Tap any card to begin.','Chạm vào một thẻ để bắt đầu.')}</p>${complete?`<div class="button-row"><button class="primary" data-action="memory-again">${t('New pictures','Chơi với hình khác')}</button><button data-action="home">${t('All activities','Tất cả hoạt động')}</button></div>`:''}<details class="little-grownup"><summary>${t('Play together','Cùng bé chơi')}</summary><p>${t('Say the English word as each picture appears. Let your child take their time. Finding pairs records a game, not an English test result.','Mỗi khi hình xuất hiện, hãy đọc từ tiếng Anh cho bé nghe. Để bé chơi thong thả. Trò tìm đôi không dùng để đánh giá trình độ tiếng Anh.')}</p></details></section>`;
}
