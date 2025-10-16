import React from 'react';
import { QuizContent } from '../types';
import { useStore } from '../store';

interface QuizViewProps {
  content: QuizContent;
  nodeId: string;
  answers: { [key: number]: string } | undefined;
}

const QuizView: React.FC<QuizViewProps> = ({ content, nodeId, answers = {} }) => {
  const { updateNodeAnswers } = useStore();

  if (!content || !Array.isArray(content)) {
    return <p className="text-muted-foreground">Invalid quiz data.</p>;
  }
  
  const handleAnswerChange = (questionIndex: number, answer: string) => {
    const newAnswers = {...answers, [questionIndex]: answer};
    updateNodeAnswers(nodeId, newAnswers);
  };

  return (
    <div className="space-y-4">
      {content.map((item, index) => (
        <div key={index} className="p-3 bg-muted/30 rounded-md">
          <p className="font-semibold mb-2">{index + 1}. {item.question}</p>
          {item.type === 'short-answer' && (
            <input
              type="text"
              className="w-full px-3 py-2 text-sm bg-input border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Your answer..."
              value={answers[index] || ''}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
            />
          )}
          {item.type === 'multiple-choice' && item.options && (
            <div className="space-y-1">
              {item.options.map((option, optIndex) => (
                <label key={optIndex} className="flex items-center p-2 space-x-2 rounded-md cursor-pointer hover:bg-accent/50">
                  <input
                    type="radio"
                    name={`quiz-${index}-${item.question}`}
                    value={option}
                    checked={answers[index] === option}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    className="w-4 h-4 text-primary bg-secondary border-border focus:ring-ring"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default QuizView;