import React from 'react';
import { useStore } from '../../store';
import { GoogleIcon } from '../icons';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

const CTASection: React.FC = () => {
  const { login } = useStore();
  const [ref, isVisible] = useScrollAnimation({ threshold: 0.3 });

  return (
    <section ref={ref} className="py-20 md:py-32 bg-secondary/50">
      <div className={`container max-w-3xl px-4 mx-auto text-center transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <h2 className="text-4xl font-bold tracking-tight md:text-5xl">Ready to Build Your Vision?</h2>
        <p className="max-w-2xl mx-auto mt-4 text-lg text-muted-foreground">
          Stop just thinking about your idea. Start building it. Your structured startup blueprint is just a few clicks away.
        </p>
        <div className="mt-10">
          <button
            onClick={login}
            className="inline-flex items-center justify-center px-8 py-4 space-x-3 text-lg font-semibold text-primary-foreground transition-all duration-300 transform rounded-lg shadow-2xl bg-primary hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background animate-pulse-glow"
          >
            <GoogleIcon className="w-6 h-6" />
            <span>Start Building for Free</span>
          </button>
        </div>
      </div>
       <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px hsl(var(--ring) / 0.4);
          }
          50% {
            box-shadow: 0 0 35px hsl(var(--ring) / 0.7);
          }
        }
        .animate-pulse-glow {
          animation: pulse-glow 3s infinite ease-in-out;
        }
      `}</style>
    </section>
  );
};

export default CTASection;
