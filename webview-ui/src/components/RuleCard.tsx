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
    avatar: string;
  };
}

interface RuleCardProps {
  rule: Rule;
  onSelect: (rule: Rule) => void;
}

const RuleCard: React.FC<RuleCardProps> = ({ rule, onSelect }) => {
  // const previewContent = rule.content.split('\n').slice(0, 3).join('\n');
  const previewContent = rule.content;

  return (
    <div className="rule-card">
      <div className="rule-header">
        <h3>{rule.title}</h3>
        <div className="tags">
          {rule.tags.map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      </div>
      <div className="rule-preview">
        <ReactMarkdown>{previewContent}</ReactMarkdown>
      </div>
      <div className="rule-footer">
        <div className="author">
          {/* <img src={rule.author.avatar} alt={rule.author.name} className="avatar" /> */}
          <span>{rule.author.name}</span>
        </div>
        <button className="use-rule-button" onClick={() => onSelect(rule)}>
          Use Rule
        </button>
      </div>
    </div>
  );
};

export default RuleCard; 