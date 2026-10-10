// Provider boundary: a future authorized adapter can implement assess(request).
// This local adapter checks structured causal choices, not free-text semantics.
export const deterministicCoach={
 name:'Local rubric',
 assess({cause,action,limits,transfer,note,metrics}){
  const checks=[
   {label:'Cause',ok:cause==='load',detail:'The extra load reduces speed at the same drive command.'},
   {label:'Feedback',ok:action==='error',detail:'The encoder measures speed. Target minus measured speed gives error; the controller adjusts drive.'},
   {label:'Limit',ok:limits==='bounded',detail:'Drive has a ceiling. Feedback cannot reach a target beyond the loaded capacity.'},
   {label:'Transfer',ok:transfer==='capacity',detail:'For the new case: 200 × 0.80 − 70 = 90 rpm. A 120 rpm target exceeds that capacity.'}
  ];
  return {adapter:'deterministic-v1',checks,complete:checks.every(c=>c.ok),noteReviewed:false,notesPresent:Boolean(note?.trim()),evidence:`During load, fixed command: ${metrics.fixedLoaded.toFixed(1)} rpm; feedback: ${metrics.feedbackLoaded.toFixed(1)} rpm. ${metrics.reachable?'This target is reachable.':'This target exceeds the loaded capacity.'}`};
 }
};
