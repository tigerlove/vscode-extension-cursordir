import { useEffect, useState } from 'react';
import { vscode } from './utilities/vscode';
import RuleCard from './components/RuleCard';
import './App.css';

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

function App() {
  console.log('App component rendering');
  const [rules, setRules] = useState<Rule[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    console.log('App useEffect triggered');
    // Request rules from extension
    console.log('Sending getRules message to extension');
    vscode.postMessage({ type: 'getRules' });

    // Handle messages from extension
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleMessage = (event: MessageEvent) => {
    console.log('Received message from extension:', event.data);
    const message = event.data;
    switch (message.type) {
      case 'setRules':
        console.log('Setting rules:', message.rules);
        setRules(message.rules);
        // Extract unique categories and sort by rule count
        const cats = Array.from(new Set(message.rules.flatMap((r: Rule) => r.tags))) as string[];
        const sortedCats = cats.sort((a, b) => {
          const countA = message.rules.filter((r: Rule) => r.tags.includes(a)).length;
          const countB = message.rules.filter((r: Rule) => r.tags.includes(b)).length;
          return countB - countA;
        });
        console.log('Setting categories:', ['all', ...sortedCats]);
        setCategories(['all', ...sortedCats]);
        break;
    }
  };

  const handleRuleSelect = (rule: Rule) => {
    console.log('Rule selected:', rule);
    vscode.postMessage({ type: 'setRule', rule });
  };

  const filteredRules = selectedCategory === 'all' 
    ? rules 
    : rules.filter(rule => rule.tags.includes(selectedCategory));
  
  console.log('Rendering with:', {
    rulesCount: rules.length,
    selectedCategory,
    filteredRulesCount: filteredRules.length,
    categories
  });

  return (
    <div className="app-container">
      <div className="sidebar">
        <nav>
          {categories.map(category => (
            <button
              key={category}
              className={`category-button ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </nav>
      </div>
      <div className="content">
        <div className="rules-grid">
          {filteredRules.map((rule, index) => (
            <RuleCard 
              key={`${rule.slug}-${index}`}
              rule={rule}
              onSelect={handleRuleSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
