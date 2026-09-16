import type { Metadata } from 'next';
import DiscoveryExperience from '@/components/discovery/DiscoveryExperience';

export const metadata: Metadata = {
  title: 'Explore Learning Paths',
  description: 'Find a clear path, learn with people who share your goal, and discover structured public Learning Paths.',
  openGraph: {
    title: 'Explore Learning Paths | ODU Learner Companion',
    description: 'Find a clear path, learn with people who share your goal, and discover structured public Learning Paths.',
  },
};

export default function ExplorePage() {
  return <DiscoveryExperience />;
}