import React from 'react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

const benefits = [
  {
    title: 'Clarity Over Chaos',
    description: 'Transform tangled thoughts into a clear, visual map. See how every part of your business connects.',
  },
  {
    title: 'AI-Powered Momentum',
    description: 'Never get stuck again. Overcome writer\'s block and analysis paralysis with an AI partner that helps you build momentum.',
  },
  {
    title: 'Actionable Outputs',
    description: 'Go beyond ideas. Generate concrete documents, plans, and to-do lists that you can execute immediately.',
  },
  {
    title: 'Founder-Focused Tools',
    description: 'From validating your idea to planning your GTM strategy, Vynixel has the specific tools you need at every stage.',
  },
];

const BenefitsSection: React.FC = () => {
    const [titleRef, isTitleVisible] = useScrollAnimation();
    const [gridRef, isGridVisible] = useScrollAnimation({threshold: 0.2});

  return (
    <section className="py-20 md:py-32">
      <div className="container max-w-6xl px-4 mx-auto">
        <div 
          ref={titleRef}
          className={`text-center transition-all duration-700 ease-out ${isTitleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">Built for Founders, by Founders.</h2>
          <p className="max-w-2xl mx-auto mt-4 text-lg text-muted-foreground">
            We know the journey. Vynixel is designed to be the co-founder you always wanted.
          </p>
        </div>
        <div ref={gridRef} className="grid grid-cols-1 gap-8 mt-16 md:grid-cols-2">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className={`transition-all duration-700 ease-out ${isGridVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="p-8 border border-border/50 rounded-xl bg-card">
                <h3 className="text-2xl font-bold text-foreground mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
