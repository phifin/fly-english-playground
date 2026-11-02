import {assess, validDraftAnswer, LEVELS} from './learning.js';

// This is rebuildable practice evidence, not a calibrated proficiency model.
const DAY = 86400000, INTERVALS = [1, 3, 7, 14, 30];
const KINDS = ['daily', 'review', 'check', 'exam', 'listening'];
const dict = () => Object.create(null);
const identifier = x => typeof x === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(x);
const timestamp = x => typeof x === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(x)
  && Number.isFinite(Date.parse(x)) && new Date(x).toISOString() === x;
const clock = value => Number.isFinite(Number(value)) && Math.abs(Number(value)) < 8.64e15 ? Number(value) : Date.now();
const dayFormatters = new Map();

export function curriculumTimeZone(value) {
  try { return new Intl.DateTimeFormat('en', {timeZone:value || 'UTC'}).resolvedOptions().timeZone; }
  catch { return 'UTC'; }
}
export function curriculumDay(value, timeZone = 'UTC') {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  let formatter = dayFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en', {timeZone:curriculumTimeZone(timeZone), year:'numeric',month:'2-digit',day:'2-digit'});
    if (dayFormatters.size > 32) dayFormatters.clear();
    dayFormatters.set(timeZone,formatter);
  }
  const parts = formatter.formatToParts(date);
  const get = key => parts.find(p => p.type === key).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Content is accepted separately. Reject ambiguous IDs even in test/custom packs. */
export function indexCurriculum(batch) {
  const objectives = new Map(), activities = new Map(), lexicon = new Map(), examSets = new Map(), listening = new Map(), ids = new Set();
  const put = (map, value) => {
    if (!identifier(value?.id) || ids.has(value.id)) throw new Error('Invalid or duplicate curriculum ID');
    ids.add(value.id); map.set(value.id, value);
  };
  for (const objective of batch.objectives ?? []) {
    put(objectives, objective);
    for (const word of objective.lexicon ?? []) put(lexicon, {...word, objectiveId:objective.id, level:objective.level});
    for (const activity of objective.activities ?? []) put(activities, {...activity, sourceKind:'objective', objectiveId:objective.id, level:objective.level, domain:objective.domain});
  }
  for (const set of batch.examSets ?? []) {
    put(examSets, set);
    for (const activity of set.activities ?? []) put(activities, {...activity, sourceKind:'exam', setId:set.id});
  }
  for (const set of batch.listening ?? []) {
    put(listening, set);
    for (const activity of set.activities ?? []) put(activities, {...activity, sourceKind:'listening', setId:set.id, level:set.level});
  }
  return {objectives, activities, lexicon, examSets, listening};
}

function orderedEvents(events, now) {
  const byId = new Map(), conflicts = new Set();
  for (const e of Array.isArray(events) ? events : []) {
    if (!e || !identifier(e.id) || !timestamp(e.at) || Date.parse(e.at) > now || !e.payload || typeof e.payload !== 'object' || Array.isArray(e.payload)) continue;
    // Conflicting identities cannot gain additional evidence through import order.
    if (byId.has(e.id) && JSON.stringify(byId.get(e.id)) !== JSON.stringify(e)) conflicts.add(e.id);
    else byId.set(e.id, e);
  }
  const priority = e => e.kind === 'support' || e.kind === 'draft' ? 0 : e.kind === 'mission' ? 1 : 2;
  return [...byId.values()].filter(e => !conflicts.has(e.id)).sort((a,b) => a.at.localeCompare(b.at) || priority(a)-priority(b) || a.id.localeCompare(b.id));
}

export function normalizeLearningPreferences(value, fallbackTimeZone = 'UTC') {
  if (!value || ![3,5,10].includes(value.goal) || !Array.isArray(value.weekdays)
    || value.weekdays.length < 1 || value.weekdays.length > 7 || new Set(value.weekdays).size !== value.weekdays.length
    || !value.weekdays.every(n => Number.isInteger(n) && n >= 0 && n <= 6)
    || typeof value.timeZone !== 'string') return null;
  const timeZone = curriculumTimeZone(value.timeZone);
  // Invalid zones do not silently replace an existing learner preference.
  if (timeZone === 'UTC' && !['UTC','Etc/UTC','Etc/GMT','GMT'].includes(value.timeZone)) {
    try { new Intl.DateTimeFormat('en', {timeZone:value.timeZone}); } catch { return null; }
  }
  return {goal:value.goal, weekdays:[...value.weekdays].sort((a,b)=>a-b), timeZone:timeZone || curriculumTimeZone(fallbackTimeZone)};
}

/** Snapshots fix a finite item set; stored scores, positions and completion flags are ignored. */
export function normalizeCurriculumSession(value, batch) {
  if (!value || !identifier(value.id) || !KINDS.includes(value.kind) || !timestamp(value.startedAt)
    || !LEVELS.includes(value.level) || !Array.isArray(value.activityIds) || !value.activityIds.length
    || value.activityIds.length > 30 || new Set(value.activityIds).size !== value.activityIds.length) return null;
  const index = indexCurriculum(batch);
  const items = value.activityIds.map(id => index.activities.get(id));
  if (items.some(a=>!a)) return null;
  const setId = typeof value.setId === 'string' ? value.setId : null;
  if (value.kind === 'exam' || value.kind === 'listening') {
    const sets = value.kind === 'exam' ? index.examSets : index.listening;
    const set = sets.get(setId);
    if (!set || items.some(a => a.sourceKind !== value.kind || a.setId !== setId)
      || value.activityIds.length !== set.activities.length || set.activities.some(a => !value.activityIds.includes(a.id))) return null;
  } else if (items.some(a => a.sourceKind !== 'objective' || (value.kind === 'check' ? a.purpose !== 'check' : !['practice','check'].includes(a.purpose)))) return null;
  const timed = Object.hasOwn(value,'timeLimitMinutes');
  if (timed && (value.kind !== 'exam' || !Number.isFinite(value.timeLimitMinutes) || value.timeLimitMinutes < 1 || value.timeLimitMinutes > 180
    || value.timeLimitMinutes !== index.examSets.get(setId)?.minutes)) return null;
  return Object.freeze({id:value.id,kind:value.kind,level:value.level,setId,startedAt:value.startedAt,activityIds:Object.freeze([...value.activityIds]),
    ...(timed ? {timeLimitMinutes:value.timeLimitMinutes} : {})});
}

function emptyItem(a) {
  return {id:a.id,objectiveId:a.objectiveId ?? null,sourceKind:a.sourceKind,level:a.level ?? null,purpose:a.purpose,
    attempts:0,correct:0,independent:0,independentDays:[],streak:0,due:null,last:null};
}
const evaluate = (a, answer) => { try { return assess(a, answer); } catch { return null; } };
const validSupportFlags = p => ['supported','answerExposed'].every(key => !Object.hasOwn(p,key) || typeof p[key] === 'boolean');

export function deriveCurriculum(events, batch, {now = Date.now(), timeZone = 'UTC', legacyActivities = new Map()} = {}) {
  now = clock(now);
  const index = indexCurriculum(batch), sorted = orderedEvents(events, now);
  let preferences = {goal:5,weekdays:[1,2,3,4,5],timeZone:curriculumTimeZone(timeZone)};
  for (const e of sorted) if (e.kind === 'mission' && e.payload.experience === 'learning-preferences-v1') {
    const normalized = normalizeLearningPreferences(e.payload, timeZone);
    if (normalized) preferences = normalized;
  }
  const zone = preferences.timeZone, records = dict(), objectives = dict(), checks = dict(), listening = dict(), exams = dict(), sessions = dict(), drafts = dict();
  // A session ID fixes one immutable item set. Conflicting cloud/import copies are
  // excluded as a whole instead of silently selecting whichever copy sorts first.
  const sessionDefinitions = new Map(), sessionConflicts = new Set();
  for (const e of sorted) if (e.kind === 'mission' && e.payload.experience === 'curriculum-session-v1') {
    const snapshot = normalizeCurriculumSession(e.payload.session,batch);
    if (!snapshot || snapshot.startedAt > e.at) continue;
    const signature = JSON.stringify(snapshot);
    if (sessionDefinitions.has(snapshot.id) && sessionDefinitions.get(snapshot.id) !== signature) sessionConflicts.add(snapshot.id);
    else sessionDefinitions.set(snapshot.id,signature);
  }
  const exposure = new Map(), dayCounts = new Map(), seen = new Map();
  for (const o of index.objectives.values()) objectives[o.id] = {id:o.id,level:o.level,domain:o.domain,stage:'new',attempts:0,correct:0,practice:{attempts:0,correct:0},check:{attempts:0,correct:0},independentItems:[],independentDays:[],due:null};
  for (const e of sorted) {
    const p = e.payload, day = curriculumDay(e.at, zone), stamp = Date.parse(e.at), a = index.activities.get(p.activityId);
    if (e.kind === 'mission' && p.experience === 'curriculum-session-v1') {
      const snapshot = normalizeCurriculumSession(p.session, batch);
      if (snapshot && snapshot.startedAt <= e.at && !sessionConflicts.has(snapshot.id) && !sessions[snapshot.id]) {
        const deadline = snapshot.timeLimitMinutes ? Date.parse(snapshot.startedAt)+snapshot.timeLimitMinutes*60000 : null;
        sessions[snapshot.id] = {snapshot,answers:dict(),correct:0,total:snapshot.activityIds.length,answered:0,supported:0,complete:false,deadline,expired:deadline!==null && now>=deadline,finished:false,
          seenBefore:snapshot.activityIds.filter(id=>seen.has(id)),recentlySeen:snapshot.activityIds.filter(id=>stamp-(seen.get(id) ?? -Infinity)<7*DAY)};
      }
    }
    if (!a) {
      if (e.kind === 'attempt' && validSupportFlags(p) && legacyActivities instanceof Map && legacyActivities.has(p.activityId)) {
        const result = evaluate(legacyActivities.get(p.activityId),p.answer);
        if (result?.complete && result.automatic) dayCounts.set(day,(dayCounts.get(day) ?? 0)+1);
      }
      continue;
    }
    if (e.kind === 'support' || (e.kind === 'draft' && (p.supported === true || p.answerExposed === true) && validDraftAnswer(a,p.answer))) exposure.set(a.id,day);
    if (e.kind === 'draft' && validSupportFlags(p) && validDraftAnswer(a,p.answer)
      && (!Object.hasOwn(p,'sessionId') || (identifier(p.sessionId) && sessions[p.sessionId]?.snapshot.activityIds.includes(a.id)))) {
      drafts[a.id] = {answer:structuredClone(p.answer),supported:p.supported===true || p.answerExposed===true || exposure.get(a.id)===day,
        sessionId:p.sessionId ?? null,savedAt:e.at};
    }
    if (e.kind !== 'attempt' || !validSupportFlags(p)) continue;
    const result = evaluate(a,p.answer);
    if (!result?.complete || !result.automatic || typeof result.correct !== 'boolean') continue;
    const supported = p.supported === true || p.answerExposed === true || exposure.get(a.id) === day;
    const independent = result.correct && !supported;
    const r = records[a.id] ??= emptyItem(a);
    r.attempts++; r.correct += Number(result.correct);
    r.last = {at:e.at,correct:result.correct,supported,sessionId:identifier(p.sessionId) ? p.sessionId : null};
    dayCounts.set(day,(dayCounts.get(day) ?? 0)+1);
    if (!result.correct || supported) exposure.set(a.id,day);
    if (a.sourceKind === 'objective') {
      if (independent) {
        r.independent++;
        if (!r.independentDays.includes(day)) r.independentDays.push(day);
        if (r.due === null || stamp >= r.due) {
          if (r.lastRecallDay !== day) r.streak = Math.min(5,r.streak+1);
          r.due = stamp+INTERVALS[Math.max(0,r.streak-1)]*DAY;
          r.lastRecallDay = day;
        }
      } else if (!result.correct) { r.streak=0; r.due=stamp+10*60000; }
      else r.due = Math.min(r.due ?? Infinity,stamp+DAY);
      const o = objectives[a.objectiveId]; o.attempts++; o.correct += Number(result.correct);
      const bucket = a.purpose === 'check' ? o.check : o.practice; bucket.attempts++; bucket.correct += Number(result.correct);
      if (independent) {
        o.firstIndependentAt ??= stamp;
        o.lastIndependentAt = stamp;
        if (!o.independentItems.includes(a.id)) o.independentItems.push(a.id);
        if (!o.independentDays.includes(day)) o.independentDays.push(day);
      }
      if (a.purpose === 'check') checks[a.id] = {attempts:r.attempts,correct:r.correct,latestCorrect:result.correct,supported,repeated:seen.has(a.id),lastAt:e.at};
    } else {
      const collection = a.sourceKind === 'exam' ? exams : listening;
      const set = collection[a.setId] ??= {attempts:0,correct:0,items:[],supported:0};
      set.attempts++; set.correct += Number(result.correct); set.supported += Number(supported);
      if (!set.items.includes(a.id)) set.items.push(a.id);
    }
    const session = sessions[p.sessionId];
    if (session && stamp >= Date.parse(session.snapshot.startedAt) && (session.deadline===null || stamp<session.deadline)
      && session.snapshot.activityIds.includes(a.id) && !session.answers[a.id]) {
      session.answers[a.id] = {answer:structuredClone(p.answer),correct:result.correct,supported,at:e.at};
      session.answered++; session.correct += Number(result.correct); session.supported += Number(supported);
      session.complete = session.answered === session.total;
    }
    delete drafts[a.id];
    seen.set(a.id,stamp);
  }
  for (const o of Object.values(objectives)) {
    o.stage = o.independentItems.length >= 2 && o.independentDays.length >= 2 && o.lastIndependentAt-o.firstIndependentAt>=DAY ? 'recalled' : o.independentItems.length ? 'independent' : o.attempts ? 'practising' : 'new';
    const dates = Object.values(records).filter(r=>r.objectiveId===o.id && r.due!==null).map(r=>r.due);
    o.due = dates.length ? Math.min(...dates) : null;
  }
  const today = curriculumDay(now,zone), end = Date.parse(`${today}T12:00:00.000Z`);
  // Calendar arithmetic is done on date keys: DST cannot create duplicate/missing days.
  const days = Array.from({length:7},(_,i)=>new Date(end-(6-i)*DAY).toISOString().slice(0,10));
  const habits = {today,days:days.map(day=>({day,attempts:dayCounts.get(day) ?? 0})),activeDays:days.filter(d=>dayCounts.has(d)).length,
    todayAttempts:dayCounts.get(today) ?? 0,goal:preferences.goal,goalMet:(dayCounts.get(today) ?? 0)>=preferences.goal,
    lifetimeActiveDays:dayCounts.size};
  const due = Object.values(records).filter(r=>r.sourceKind==='objective' && r.due!==null && r.due<=now).sort((a,b)=>a.due-b.due || a.id.localeCompare(b.id));
  for (const session of Object.values(sessions)) session.finished=session.complete || session.expired;
  return {records,objectives,due,checks,exams,listening,sessions,drafts,sessionConflicts:[...sessionConflicts].sort(),habits,preferences,now,timeZone:zone};
}

/** Due retrieval first, then missing foundations, then new material; never a lock. */
export function recommendations(batch, progress, {level='A1', limit=5} = {}) {
  const index = indexCurriculum(batch), result=[], selected=new Set();
  const add=(objectiveId,reason)=>{
    if (!selected.has(objectiveId) && index.objectives.has(objectiveId)) { selected.add(objectiveId); result.push({objectiveId,reason,level:index.objectives.get(objectiveId).level}); }
  };
  for (const item of progress.due) add(item.objectiveId,'due');
  const current = [...index.objectives.values()].filter(o=>o.level===level);
  const visited = new Set();
  const foundations = id => {
    if (visited.has(id)) return;
    visited.add(id);
    for (const prerequisite of index.objectives.get(id)?.prerequisites ?? []) if (!['independent','recalled'].includes(progress.objectives[prerequisite]?.stage)) {
      foundations(prerequisite); add(prerequisite,'foundation');
    }
  };
  for (const o of current) foundations(o.id);
  for (const o of current) if (!progress.objectives[o.id]?.attempts) add(o.id,'new');
  for (const o of current) add(o.id,'practice');
  return result.slice(0,Math.max(1,Math.min(30,Number.isInteger(limit)?limit:5)));
}

export function selectCurriculumSession(batch, progress, {kind='daily',level='A1',objectiveId=null,setId=null,size=5,sessionId=globalThis.crypto.randomUUID(),now=Date.now(),timed=false} = {}) {
  const index=indexCurriculum(batch), ids=[], add=id=>{if (!ids.includes(id)) ids.push(id);};
  size = Math.max(1,Math.min(30,Number.isInteger(size)?size:5));
  if (kind==='exam' || kind==='listening') {
    const set = (kind==='exam'?index.examSets:index.listening).get(setId);
    if (!set) return null;
    for (const a of set.activities) add(a.id);
  } else {
    const objectiveIds=objectiveId ? [objectiveId] : recommendations(batch,progress,{level,limit:30}).map(r=>r.objectiveId);
    const candidates=objectiveIds.flatMap(id=>(index.objectives.get(id)?.activities ?? []).filter(a=>a.purpose===(kind==='check'?'check':'practice'))
      .sort((a,b)=>(progress.records[a.id]?.attempts ?? 0)-(progress.records[b.id]?.attempts ?? 0)));
    if (kind==='review' || kind==='daily') for (const r of progress.due) if (objectiveIds.includes(r.objectiveId)) add(r.id);
    // Checkpoints prefer unseen items but disclose repeats when this finite bank is exhausted.
    if (kind==='check') candidates.sort((a,b)=>(progress.records[a.id]?.attempts ?? 0)-(progress.records[b.id]?.attempts ?? 0));
    if (kind!=='review') for (const a of candidates) add(a.id);
  }
  return normalizeCurriculumSession({id:sessionId,kind,level,setId,startedAt:new Date(clock(now)).toISOString(),activityIds:kind==='exam'||kind==='listening'?ids:ids.slice(0,size),
    ...(timed ? {timeLimitMinutes:index.examSets.get(setId)?.minutes} : {})},batch);
}

export function curriculumSummary(progress) {
  const all=Object.values(progress.objectives), stages={new:0,practising:0,independent:0,recalled:0};
  for (const o of all) stages[o.stage]++;
  return {objectives:all.length,stages,attempts:Object.values(progress.records).reduce((n,r)=>n+r.attempts,0),due:progress.due.length,
    activeDays:progress.habits.activeDays,checkpoints:Object.values(progress.sessions).filter(s=>s.snapshot.kind==='check' && s.complete).length,
    needsPractice:[...new Set(Object.values(progress.records).filter(r=>r.objectiveId && r.last && (!r.last.correct || r.last.supported)).map(r=>r.objectiveId))],provisional:true};
}
