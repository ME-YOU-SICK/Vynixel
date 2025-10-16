import React from 'react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

const features = [
  {
    icon: '🧠',
    title: 'Visual Node-Based Canvas',
    description: 'Break free from linear documents. Brainstorm, connect, and structure your ideas organically on an infinite canvas.',
  },
  {
    icon: '➕',
    title: 'Context-Aware AI Expansion',
    description: 'Click to expand any idea. The AI understands the context of parent nodes to generate relevant, connected content.',
  },
  {
    icon: '📝',
    title: 'Editable AI Outputs',
    description: 'Every AI generation is fully editable. Refine, rewrite, or add your own insights directly within each node.',
  },
  {
    icon: '🗺️',
    title: 'Complete Startup Frameworks',
    description: 'Generate everything from User Personas and PRDs to Marketing Strategies and Funding Roadmaps with a single click.',
  },
  {
    icon: '🔄',
    title: 'Smart Regeneration',
    description: 'Not satisfied? Regenerate any node with new context or a different perspective to iterate on your ideas instantly.',
  },
  {
    icon: '📤',
    title: 'Blueprint Export',
    description: 'Compile your entire visual map into a structured, professional startup blueprint ready for PDF or Notion.',
  },
];

const FeatureCard: React.FC<{ feature: typeof features[0], index: number }> = ({ feature, index }) => {
    const [ref, isVisible] = useScrollAnimation({ threshold: 0.2 });
    return (
        <div
        ref={ref}
        className={`bg-card border border-border/50 rounded-xl p-6 glow-effect transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        style={{ transitionDelay: `${index * 100}ms` }}
        >
        <div className="text-4xl mb-4">{feature.icon}</div>
        <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
        <p className="text-muted-foreground text-sm">{feature.description}</p>
        </div>
    );
}


const FeaturesSection: React.FC = () => {
    const [titleRef, isTitleVisible] = useScrollAnimation();

  return (
    <section className="py-20 md:py-32">
      <div className="container max-w-6xl px-4 mx-auto">
        <div 
        ref={titleRef}
        className={`text-center transition-all duration-700 ease-out ${isTitleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">An Entire Startup Toolkit, Reimagined.</h2>
          <p className="max-w-2xl mx-auto mt-4 text-lg text-muted-foreground">
            Vynixel isn’t just a note-taking app. It’s a purpose-built system for thinking, planning, and building.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 mt-16 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
