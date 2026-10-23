export const passages=[
 'A robot can send a command to a motor without knowing what the motor actually did. A command is an instruction. A measurement is evidence.',
 'Imagine a wheel turning at one hundred revolutions per minute. Add a load, and the same drive command can produce a lower speed. The command did not change. The conditions did.',
 'An encoder observes rotation. We estimate speed from how much the shaft turns over time. In this lab the measurement is ideal, so we can focus on feedback before exploring sensor noise.',
 'A feedback controller compares target speed with measured speed. The difference is the error. A proportional and integral controller can increase drive to compensate for a sustained load, as long as enough drive is available.',
 'Before running the experiment, predict what happens when the load arrives. Both virtual motors start from rest with the same target and model. Only the control strategy differs.',
 'The fixed command stays constant. Feedback uses the measured speed to adjust drive. Neither strategy can produce more drive than the selected ceiling. Think about capacity as well as correction.',
 'The experiment lasts twelve seconds. Load starts at four seconds and ends at nine. Watch both motors, the speed graph and the drive trace. The fixed-command motor keeps one drive setting; the feedback motor changes its drive.',
 'Compare the average speeds during the last second of load. Then try an unreachable target. If the motor is already at its drive ceiling, the controller cannot restore the requested speed under that load.',
 'Explain the result as a chain of causes: load changed the motor response, the encoder measured the new speed, and the controller used the speed error to adjust drive. Include what the drive ceiling prevented.',
 'The local coach checks four selected causal statements. It saves your written note without pretending to understand it. The experiment and your explanation are evidence for this lesson, not proof of real hardware performance.'
];
export const source=(label,url)=>`<p class="source-note">SOURCE ANCHOR · <a href="${url}" target="_blank" rel="noreferrer">${label} ↗</a><br>Lesson wording is our synthesis, not a quotation.</p>`;
export const sentence=i=>`<p class="sentence">${passages[i]}</p>`;
