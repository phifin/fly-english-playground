/** Reviewed practice editions add new definitions; saved answers retain their original keys. */
export function applyPracticeEdition(pack,edition){
 if(pack?.practiceEdition)throw new Error('A practice edition cannot be applied twice.');
 if(edition?.schemaVersion!==1||!Array.isArray(edition.revisions)||!Array.isArray(edition.support))throw new Error('Invalid practice edition.');
 const originals=new Map(pack.missions.flatMap(m=>m.activities.map(a=>[a.id,{activity:a,missionId:m.id}]))),replacements=new Map(),ids=new Set(originals.keys());
 for(const revision of edition.revisions){
  const original=originals.get(revision.replaces);
  if(!original||original.missionId!==revision.missionId||replacements.has(revision.replaces)||revision.activity?.id!==revision.replaces+'-v2'||ids.has(revision.activity.id))throw new Error('Invalid or duplicate practice replacement.');
  replacements.set(revision.replaces,revision);ids.add(revision.activity.id);
 }
 const historicalMissions=pack.missions.filter(m=>m.activities.some(a=>replacements.has(a.id)));
 const missions=pack.missions.map(m=>({...m,activities:m.activities.map(a=>replacements.get(a.id)?.activity??a)}));
 const support=Object.create(null);
 for(const record of edition.support){
  if(!originals.has(record.activityId)||replacements.has(record.activityId)||Object.hasOwn(support,record.activityId))throw new Error('Invalid or duplicate practice support.');
  support[record.activityId]={terms:record.terms,hint:record.hint,prerequisites:record.prerequisites};
 }
 for(const revision of edition.revisions)support[revision.activity.id]={terms:revision.terms,hint:revision.hint,prerequisites:revision.prerequisites};
 return {...pack,missions,historicalMissions,practiceEdition:{id:edition.editionId,retiredActivityIds:[...replacements.keys()],replacements:Object.fromEntries([...replacements].map(([id,r])=>[id,r.activity.id])),support}};
}

/** No authoring notes or answer keys are exposed by the assistance component. */
export function practiceSupport(pack,activityId){
 return pack?.practiceEdition?.support?.[activityId]??null;
}
