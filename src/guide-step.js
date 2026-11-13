/** Guidance follows observable interaction state, never correctness or answer keys. */
export function guideStep({topic,answer,activity,stage,feedback,moved=false,workshopSelected,little,memory}={}){
 const step=(id,selector,en,vi)=>({id,selector,copy:[en,vi]});
 const submit=()=>step('check','.activity-actions [data-action="submit"]','Your answer is ready to check. You can still change it.','Bạn có thể kiểm tra câu trả lời, hoặc sửa lại trước khi kiểm tra.');
 if(feedback)return feedback.correct===false?step('retry','.feedback [data-action="retry"]','Read the explanation, then try again when you’re ready.','Xem giải thích rồi thử trả lời lại nhé.'):step('continue','.feedback [data-action="next"]','Your response is saved. Continue to the next step.','Đã lưu câu trả lời. Tiếp tục sang bước tiếp theo nhé.');
 if(stage==='clue')return step('open','[data-action="ready"]','Read or listen to the clue, then open the activity.','Đọc hoặc nghe gợi ý rồi mở bài luyện tập.');
 if(topic==='choice')return answer?submit():step('choose','.choice-grid','Choose one answer. You can change your mind before checking.','Chọn một câu trả lời. Bạn có thể đổi trước khi kiểm tra.');
 if(topic==='gap')return String(answer??'').trim()?submit():step('type','[data-answer="gap"]','Type a word in this space.','Điền từ vào chỗ trống này.');
 if(topic==='match'){
  const index=activity.pairs.findIndex(pair=>!answer?.[pair.id]);
  return index<0?submit():step('pair-'+index,`.match-row:nth-child(${index+1}) select`,'Choose a partner for this line. Then continue to the next line.','Chọn phần ghép với dòng này rồi làm dòng tiếp theo.');
 }
 if(topic==='order')return moved?submit():step('move','.order-workspace button:not(:disabled)','Move a piece with an arrow. Keep arranging until you’re ready to check.','Dùng mũi tên để chuyển một phần. Xếp tiếp cho đến khi bạn muốn kiểm tra.');
 if(topic==='writing'){
  if(!answer?.text?.trim())return step('write','[data-answer="writing"]','Write a short response in your own words.','Viết câu trả lời ngắn bằng lời của bạn.');
  return (answer.checks?.length??0)<activity.rubric.length?step('review','.rubric input:not(:checked)','Read each point and check your own writing.','Đọc từng mục rồi tự xem lại bài viết của bạn.'):submit();
 }
 if(topic==='workshop')return workshopSelected?step('place','.workshop-scene','Now tap a place in the scene. You can move your toy again later.','Giờ chạm vào một chỗ trong cảnh để đặt đồ chơi. Bạn có thể chuyển chỗ sau.'):step('pick','.workshop-tray button','Choose a toy to put in the scene.','Chọn một đồ chơi để đặt vào cảnh.');
 if(topic==='memory')return memory?.open?.length===1?step('second-card','.memory-board','Now turn over another card. Look for the same picture.','Giờ lật thêm một thẻ. Thử tìm hình giống nhau nhé.'):step('first-card','.memory-board button:not(:disabled)','Turn over one card to see its picture.','Lật một thẻ để xem hình.');
 if(topic==='picture-find')return little?.heard?step('picture','.little-choices','Now choose the picture for the word you heard.','Giờ chọn hình ứng với từ vừa nghe.'):step('listen','.little-hear','Tap the speaker. Listen for the word.','Chạm vào loa để nghe từ.');
 if(topic==='picture-explore'&&little?.heard)return step('next-picture','[data-action="little-next"]','Say the word together, then see the next picture.','Cùng đọc từ rồi xem bức tranh tiếp theo.');
 return null;
}
