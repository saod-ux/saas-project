// Mock knowledge base articles
const knowledgeBaseArticles = [
  {
    id: 1,
    title: "Getting Started Guide",
    category: "Setup",
    views: 1250,
    lastUpdated: "2024-01-10"
  },
  {
    id: 2,
    title: "How to Add Custom Domains",
    category: "Domains",
    views: 890,
    lastUpdated: "2024-01-08"
  },
  {
    id: 3,
    title: "Payment Integration Setup",
    category: "Billing",
    views: 650,
    lastUpdated: "2024-01-05"
  },
  {
    id: 4,
    title: "Product Management Tips",
    category: "Products",
    views: 420,
    lastUpdated: "2024-01-03"
  },
  {
    id: 5,
    title: "Multi-language Configuration",
    category: "Localization",
    views: 380,
    lastUpdated: "2024-01-01"
  }
];

export default function KnowledgeBase() {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Knowledge Base</h3>
        <button className="text-sm text-blue-600 hover:text-blue-800">
          Manage Articles
        </button>
      </div>
      
      <div className="space-y-3">
        {knowledgeBaseArticles.map((article) => (
          <div key={article.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  {article.title}
                </h4>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    {article.category}
                  </span>
                  <span>{article.views} views</span>
                  <span>Updated {new Date(article.lastUpdated).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="w-full text-sm text-blue-600 hover:text-blue-800 py-2">
          + Add New Article
        </button>
      </div>
    </div>
  );
}


