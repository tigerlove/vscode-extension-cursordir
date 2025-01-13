import React from 'react';
import ReactMarkdown from 'react-markdown';

interface Rule {
  title: string;
  tags: string[];
  slug: string;
  libs: string[];
  content: string;
  author: {
    name: string;
    url: string;
    avatar: string | null;
  };
}

interface RuleCardProps {
  rule: Rule;
  onSelect: (rule: Rule) => void;
}

const RuleCard: React.FC<RuleCardProps> = ({ rule, onSelect }) => {
  const handleClick = () => {
    onSelect(rule);
  };

  const previewContent = `${rule.content.slice(0, 200)}...`;

  return (
    <div className="rule-card">
      <div className="rule-header">
        <h3>{rule.title}</h3>
        <div className="tags">
          {rule.tags.map((tag, index) => (
            <span key={index} className="tag">{tag}</span>
          ))}
        </div>
      </div>
      <div className="rule-preview">
        <ReactMarkdown>{previewContent}</ReactMarkdown>
      </div>
      <div className="rule-footer">
        <div className="author">
          {rule.author.avatar && (
            <img 
              src={rule.author.avatar} 
              alt={`${rule.author.name}'s avatar`} 
              className="avatar" 
            />
          )}
          <span>{rule.author.name}</span>
        </div>
        <button className="use-rule-button" onClick={handleClick}>
          Use Rule
        </button>
      </div>
    </div>
  );
};

export default RuleCard; 