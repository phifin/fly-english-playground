// A learning preference is an explicit choice. A default profile field is not.
const readerScreens=new Set(['library','review','mission','quick','studio']);
const learningScreens=new Set(['home','atlas','adventures','workshop','little','memory','pictures',...readerScreens]);
const readerActions=new Set(['quick-start','study-begin','begin','review-item','activity','ready','investigate','route-game','submit','retry','reveal','model','next','trail-next','collect-discovery','workshop-request','workshop-next','workshop-revisit']);
export function learningDestination(screen,state){
 if(!state?.established&&learningScreens.has(screen))return 'entry';
 if(!state?.readerReady&&readerScreens.has(screen))return 'entry';
 return screen==='onboard'?'entry':screen;
}
export function readingActionBlocked(action,state){return readerActions.has(action)&&!state?.readerReady;}

// Never save a successful setup receipt before its required profile write.
// Failed storage leaves onboarding visible and existing learning history intact.
export async function establishLearningStart({path,level=null,updateProfile,append}){
 if(!['reader','supported-pictures'].includes(path)||path==='reader'&&!['A1','A2','B1','B2','C1','C2'].includes(level)||path==='supported-pictures'&&level!==null)throw new TypeError('Invalid learning start');
 await updateProfile({journey:{onboarded:true,...(path==='reader'?{region:level}:{})}});
 await append('mission',{experience:'learning-entry-v1',version:1,path,level});
}
