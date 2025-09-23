// Mock support tickets data
const supportTickets = [
  {
    id: "TICKET-001",
    subject: "Custom domain not working",
    merchant: "Acme Store",
    status: "open",
    priority: "high",
    createdAt: "2024-01-15T10:30:00Z"
  },
  {
    id: "TICKET-002", 
    subject: "Payment integration issue",
    merchant: "Tech Shop",
    status: "in_progress",
    priority: "medium",
    createdAt: "2024-01-14T15:45:00Z"
  },
  {
    id: "TICKET-003",
    subject: "How to add products?",
    merchant: "New Store",
    status: "resolved",
    priority: "low",
    createdAt: "2024-01-13T09:20:00Z"
  }
];

export default function SupportTickets() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-red-100 text-red-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "resolved": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Recent Support Tickets</h3>
        <button className="text-sm text-blue-600 hover:text-blue-800">
          View All
        </button>
      </div>
      
      <div className="space-y-3">
        {supportTickets.map((ticket) => (
          <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    {ticket.id}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                    {ticket.status.replace("_", " ")}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  {ticket.subject}
                </h4>
                <p className="text-sm text-gray-600">
                  From: {ticket.merchant}
                </p>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              {new Date(ticket.createdAt).toLocaleDateString()} at{" "}
              {new Date(ticket.createdAt).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
      
      {supportTickets.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No support tickets</p>
        </div>
      )}
    </div>
  );
}


