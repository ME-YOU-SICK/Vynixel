import React from 'react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

const steps = [
  {
    title: 'Plant the Seed',
    description: 'Start with a single node. Write down your raw, unfiltered idea. This is the root from which your entire startup will grow.',
  },
  {
    title: 'Expand Your Vision',
    description: 'Click the "+" icons to expand in any direction. Ask the AI to define the problem, suggest a tech stack, or map user personas.',
  },
  {
    title: 'Refine and Iterate',
    description: 'Every AI-generated node is a starting point. Edit the text, add your insights, and regenerate sections to perfectly match your vision.',
  },
  {
    title: 'Export Your Blueprint',
    description: 'When you\'re ready, compile your connected thoughts into a single, structured document—your complete startup blueprint.',
  },
];

const HowItWorksSection: React.FC = () => {
    const [titleRef, isTitleVisible] = useScrollAnimation();
    const [stepsRef, areStepsVisible] = useScrollAnimation({ threshold: 0.1 });

  return (
    <section className="py-20 md:py-32 bg-secondary/50">
      <div className="container max-w-4xl px-4 mx-auto">
        <div 
            ref={titleRef}
            className={`text-center transition-all duration-700 ease-out ${isTitleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">Your Vision, Visualized.</h2>
          <p className="max-w-2xl mx-auto mt-4 text-lg text-muted-foreground">
            Four simple steps from a fleeting thought to a concrete plan.
          </p>
        </div>
        <div ref={stepsRef} className="relative mt-20">
            <div className={`absolute left-4 md:left-1/2 w-0.5 bg-border/50 transition-all duration-1000 ease-out ${areStepsVisible ? 'h-full' : 'h-0'}`} />
            {steps.map((step, index) => {
                const isEven = index % 2 === 0;
                return (
                    <div key={index} className={`relative mb-12 flex items-center w-full ${isEven ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
                        <div className={`z-10 w-8 h-8 flex items-center justify-center font-bold bg-primary text-primary-foreground rounded-full ring-8 ring-background absolute left-4 -translate-x-1/2 md:left-1/2`}>
                            {index + 1}
                        </div>
                        <div className={`w-full pl-12 md:pl-0 md:w-5/12 transition-all duration-700 ease-out ${areStepsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{transitionDelay: `${200 + index * 150}ms`}}>
                            <div className={`p-6 bg-card border border-border/50 rounded-xl glow-effect ${isEven ? 'md:mr-8' : 'md:ml-8'}`}>
                                <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                                <p className="text-muted-foreground">{step.description}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
