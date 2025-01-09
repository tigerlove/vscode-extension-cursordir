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
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value.toLowerCase());
  };

  // Filter categories based on search query
  const filteredCategories = categories.filter(category => 
    category === 'all' || category.toLowerCase().includes(searchQuery)
  );

  // Filter rules by selected category
  const filteredRules = rules.filter(rule => 
    selectedCategory === 'all' || rule.tags.includes(selectedCategory)
  );

  // Calculate category counts
  const categoryRuleCounts = rules.reduce((acc, rule) => {
    rule.tags.forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  console.log('Rendering with:', {
    rulesCount: rules.length,
    filteredCategoriesCount: filteredCategories.length,
    finalFilteredCount: filteredRules.length,
    selectedCategory,
    searchQuery
  });

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        <nav>
          {filteredCategories.map(category => (
            <button
              key={category}
              className={`category-button ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
              <span className="category-count">
                {category === 'all' 
                  ? rules.length
                  : categoryRuleCounts[category] || 0}
              </span>
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
