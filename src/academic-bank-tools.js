// Original Atlas exercises share the published, immutable academic scoring contract.
export function choice(skill,prompt,options,answer,en,vi){
  return {skill,prompt,options,keys:[answer],why:[en,vi]};
}
export function gap(skill,prompt,answers,en,vi){
  return {skill,prompt,keys:Array.isArray(answers)?answers:[answers],why:[en,vi]};
}
export const fact=(prompt,answer,en,vi)=>choice('evidence',prompt,['TRUE','FALSE','NOT GIVEN'],answer,en,vi);
export const opinion=(prompt,answer,en,vi)=>choice('evidence',prompt,['YES','NO','NOT GIVEN'],answer,en,vi);
export const oneWord=(prompt,answer,en,vi)=>gap('detail','Use ONE WORD from the passage. '+prompt,answer,en,vi);

