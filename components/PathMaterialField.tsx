interface Props {
  kind: 'overview' | 'day';
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

// Both authoring forms save the same existing Markdown fields and heading convention.
export default function PathMaterialField({ kind, value, onChange, id }: Props) {
  const overview = kind === 'overview';
  return <div id={id} className="material-field">
    <label>{overview ? 'Overview & optional references (Markdown)' : 'Lesson material (Markdown, optional)'}
      <textarea value={value} maxLength={100000} rows={overview ? 6 : 8} onChange={event => onChange(event.target.value)}
        placeholder={overview ? 'Who is this path for?\n\n## What you will learn\nDescribe the outcomes.\n\n## Optional reference library\n- [Resource title](https://example.com)' : '## Understand\nExplain the topic.\n\n## Watch\n- [Video title](https://example.com)\n\n## Read\n- [Reading title](https://example.com)\n\n## Practice activity\nDescribe the activity.\n\n## Expected outcome\nWhat should the learner achieve?'} />
    </label>
    <p className="material-hint">
      {overview ? <>Optional. Add audience, prerequisites and outcomes. Use <code>## Optional reference library</code> for links shown in the separate reference library.</> : <>Optional. Use <code>## Watch</code>, <code>## Read</code> or <code>## References</code> for resource links, and <code>## Practice activity</code> for exercises. Existing lesson URLs are used when these sections are empty.</>}
    </p>
    <style jsx>{`
      .material-field { width:100%;min-width:0;scroll-margin-top:12rem; }
      .material-field label { display:flex;flex-direction:column;align-items:stretch;gap:.4rem;font-weight:600; }
      .material-field textarea { display:block;box-sizing:border-box;width:100%;max-width:100%;min-height:10rem;resize:vertical;font:inherit; }
      .material-hint { margin:.5rem 0 0;color:var(--text-secondary);font-size:.85rem;line-height:1.6; }
    `}</style>
  </div>;
}
