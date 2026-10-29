import type { Root, RootContent } from 'mdast';

export type MaterialView = 'all' | 'lesson' | 'resources' | 'practice' | 'overview' | 'library';
const resourceHeading = /^(watch|read|practice|references)(?:\s*[—–-].*)?$/i;
const practiceHeading = /^(practice activity|expected outcome)$/i;
const libraryHeading = /^(optional\s+)?reference library$/i;

function text(node: RootContent): string {
  if ('value' in node) return String(node.value);
  if ('children' in node) return node.children.map(child => text(child as RootContent)).join('');
  return '';
}

// Partition parsed Markdown, so headings inside fenced examples cannot hide lesson text.
// Keep link/footnote definitions in both views so reference-style links still resolve.
export function selectMaterial(tree: Root, view: MaterialView): Root {
  if (view === 'all') return tree;
  let selected = view === 'lesson' || view === 'overview';
  const children = tree.children.filter(node => {
    if (node.type === 'definition' || node.type === 'footnoteDefinition') return true;
    if (node.type === 'heading' && node.depth <= 2) {
      const title = text(node).trim();
      const resource = node.depth === 2 && resourceHeading.test(title);
      const practice = node.depth === 2 && practiceHeading.test(title);
      const library = node.depth === 2 && libraryHeading.test(title);
      selected = view === 'resources' ? resource : view === 'lesson' ? !resource && !practice : view === 'practice' ? practice : view === 'library' ? library : !library;
    }
    return selected;
  });
  return { ...tree, children };
}

export function materialViewPlugin({ view }: { view: MaterialView }) {
  return (tree: Root) => { tree.children = selectMaterial(tree, view).children; };
}

export function studyTime(hours: string | null): string | null {
  if (!hours) return null;
  const number = Number(hours);
  if (!Number.isFinite(number) || number <= 0) return `${hours} hours`;
  const minutes = Math.round(number * 60);
  return minutes < 60 ? `${minutes} min` : minutes % 60 ? `${Math.floor(minutes / 60)} hr ${minutes % 60} min` : `${minutes / 60} hr`;
}
