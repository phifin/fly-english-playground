/** UI privacy on shared browsers. IndexedDB is not encrypted or an OS security boundary. */
export function accessibleProfiles(profiles,status){
 let visible=profiles.filter(p=>!p.cloudOwnerUid||p.cloudOwnerUid===status?.uid);
 for(let n=0;n<profiles.length;n++){
  const ids=new Set(visible.map(p=>p.id)),next=visible.filter(p=>!p.guardianId||ids.has(p.guardianId));
  if(next.length===visible.length)break;visible=next;
 }
 return visible;
}
export function accountBackup(backup,status){
 const profiles=accessibleProfiles(backup.profiles,status),ids=new Set(profiles.map(p=>p.id));
 return {...backup,profiles,events:backup.events.filter(e=>ids.has(e.profileId))};
}
export function profileSaveStatus(status,profile,events=[]){
 const stamp=status.syncedAt&&Date.parse(status.syncedAt);
 const dirty=!stamp||Date.parse(profile?.updatedAt)>stamp||events.some(e=>e.kind!=='draft'&&Date.parse(e.at)>stamp);
 return {...status,...(dirty||status.syncedProfileId!==profile?.id?{syncedProfileId:null,syncedAt:null}:{})};
}
