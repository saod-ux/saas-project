import { prisma } from "@/lib/prisma";
import { Mail, Calendar, Shield, Eye } from "lucide-react";

export default async function UsersTable() {
  const users = await prisma.user.findMany({
    include: {
        memberships: {
          include: {
            tenant: {
              select: {
                name: true,
                slug: true
              }
            }
          }
        }
    },
    orderBy: { createdAt: "desc" },
    take: 50 // Limit for performance
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">All Users</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Merchants
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Roles
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => {
              const merchants = user.memberships.map(member => ({
                name: member.tenant.name,
                slug: member.tenant.slug,
                role: member.role
              }));
              
              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {user.name?.slice(0, 2).toUpperCase() || "U"}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || "Unknown User"}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {merchants.length} merchant{merchants.length !== 1 ? 's' : ''}
                    </div>
                    <div className="text-sm text-gray-500">
                      {merchants.slice(0, 2).map(m => m.name).join(", ")}
                      {merchants.length > 2 && ` +${merchants.length - 2} more`}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {merchants.slice(0, 2).map((merchant, index) => (
                        <span
                          key={index}
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            merchant.role === "OWNER" 
                              ? "bg-purple-100 text-purple-800"
                              : merchant.role === "ADMIN"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {merchant.role}
                        </span>
                      ))}
                      {merchants.length > 2 && (
                        <span className="text-xs text-gray-500">
                          +{merchants.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {users.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users yet</h3>
            <p className="text-gray-500">Users will appear here once they sign up.</p>
          </div>
        </div>
      )}
    </div>
  );
}
