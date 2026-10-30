export function pathMetadataFields({ title, description, overviewMarkdown, tagsInput }: {
  title: string; description: string; overviewMarkdown: string; tagsInput: string;
}) {
  const seen = new Set<string>();
  const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => {
    if (!tag || seen.has(tag.toLowerCase())) return false;
    seen.add(tag.toLowerCase());
    return true;
  });
  return { title: title.trim(), description: description.trim() || null, overviewMarkdown: overviewMarkdown.trim() || null, tags };
}
