// Convert authoring content into Markdown suitable for the existing path/day records.
export function courseOverviewMarkdown(course){
 return [
  `**${course.category} · ${course.level} · ${course.durationDays} days · ${course.estimatedHours}**`,
  `**Before you start:** ${course.prerequisites}`,
  `**Who this is for:** ${course.audience.join(', ')}.`,
  `${course.dailyCommitment}. Planned activities total ${Math.floor(course.totalMinutes/60)} hours ${course.totalMinutes%60} minutes. Longer external courses are supporting resources; focus on the sections relevant to each day's objective.`,
  'No programming or paid API is required. AI tools used in practice are external services, not an AI assistant built into ODU. Use non-sensitive examples and check important claims.',
  '## What you will learn',
  course.outcomes.map(outcome=>`- ${outcome}`).join('\n'),
  '## Optional reference library',
  'These references do not affect completion. Access conditions vary; no optional course subscription is required.',
  course.references.map(resource=>`- [${resource.title}](${resource.url})`).join('\n'),
  course.completionNote,
 ].join('\n\n');
}
export function moduleContentMarkdown(lesson){
 const parts=[`**Objective:** ${lesson.objective}`,'## Understand',lesson.teaching];
 for(const kind of ['Watch','Read','Practice','References']){
  const resources=lesson.resources.filter(resource=>resource.kind===kind);
  if(resources.length)parts.push(`## ${kind}${kind==='References'?' — optional developer extension':''}`,resources.map(resource=>`- [${resource.title}](${resource.url})${resource.optional?' — Optional':''}`).join('\n'));
 }
 parts.push('## Practice activity',lesson.practice,'## Expected outcome',lesson.outcome,'After working through the activity, mark the completion item for this day. Keep your reflection in Personal Notes. Completion is self-reported participation, not verified mastery.');
 return parts.join('\n\n');
}
