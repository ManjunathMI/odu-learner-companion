export function pathInvitationMessage(title: string, description: string | null, link: string, reminder = false) {
  const safeTitle = title.replace(/[\r\n]+/g, ' ').slice(0, 150);
  return {
    subject: reminder ? `Reminder to explore ${safeTitle}` : `Let’s learn ${safeTitle} together!`,
    text: [
      reminder
        ? `You have a Learning Path invitation for ${safeTitle} on ODU Learner Companion.`
        : `I’m exploring ${safeTitle}. Let’s learn it together, help each other stay on track, and make it a friendly competition!`,
      'ODU Learner Companion helps you follow structured learning plans, practice at your own pace, and track your progress alongside others.',
      description?.trim().slice(0, 400) || 'This path gives us a step-by-step plan and a shared goal to work toward.',
      `Explore the path and request to join:\n${link}`,
      'You can also create your own Learning Path and invite friends to learn with you.',
    ].join('\n\n'),
  };
}
