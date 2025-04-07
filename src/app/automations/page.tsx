"use client";

import { useState, useEffect, useMemo } from "react";
import { useCategorization } from "@/lib/categorization";
import { CategorizationAutomation } from "@/lib/categorization/types";
import { toast } from "react-toastify";
import { Check, X, Info, Search, RotateCcw } from "lucide-react";
import { 
  Table, 
  TableColumn, 
  SortDirection,
  Button,
  Input,
  Modal,
  Pagination,
  ScrollArea,
  LoadingPlaceholder
} from "@/components/ui";

export default function ContextAutomationsPage() {
  // State for automations data and UI
  const [automations, setAutomations] = useState<CategorizationAutomation[]>([]);
  const [filteredAutomations, setFilteredAutomations] = useState<CategorizationAutomation[]>([]);
  const [selectedAutomation, setSelectedAutomation] = useState<CategorizationAutomation | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // State for search, filter, and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const categorization = useCategorization();

  // Fetch automations on component mount
  useEffect(() => {
    fetchAutomations();
  }, []);
  
  // Filter and sort automations when dependencies change
  useEffect(() => {
    let result = [...automations];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(automation => 
        automation.name.toLowerCase().includes(term) || 
        automation.source.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      result = result.filter(automation => automation.status === statusFilter);
    }
    
    // Apply source filter
    if (sourceFilter) {
      result = result.filter(automation => automation.source === sourceFilter);
    }
    
    // Sort the results
    result = sortAutomations(result, sortField, sortDirection);
    
    setFilteredAutomations(result);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [automations, searchTerm, statusFilter, sourceFilter, sortField, sortDirection]);
  
  // Calculate paginated data
  const paginatedAutomations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAutomations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAutomations, currentPage, itemsPerPage]);
  
  // Helper functions
  const fetchAutomations = async () => {
    setLoading(true);
    try {
      const fetchedAutomations = await categorization.automations.getAutomations();
      setAutomations(fetchedAutomations);
    } catch (error) {
      console.error("Error fetching automations:", error);
      toast.error("Failed to load context automations");
    } finally {
      setLoading(false);
    }
  };
  
  const sortAutomations = (automationsToSort: CategorizationAutomation[], field: string, direction: SortDirection) => {
    return [...automationsToSort].sort((a, b) => {
      // Handle different field types
      if (field === "createdAt") {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return direction === "asc" ? dateA - dateB : dateB - dateA;
      }
      
      // Handle string fields
      const valueA = String((a as any)[field] || "").toLowerCase();
      const valueB = String((b as any)[field] || "").toLowerCase();
      
      if (direction === "asc") {
        return valueA.localeCompare(valueB);
      } else {
        return valueB.localeCompare(valueA);
      }
    });
  };
  
  const handleSort = (field: string) => {
    setSortDirection(prev => 
      field === sortField 
        ? prev === "asc" ? "desc" : "asc" 
        : "asc"
    );
    setSortField(field);
  };

  // View automation details
  const handleViewDetails = async (automationId: string) => {
    try {
      const automation = await categorization.automations.getAutomation(automationId);
      setSelectedAutomation(automation);
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching automation details:", error);
      toast.error("Failed to load automation details");
    }
  };

  // Approve an automation
  const handleApproveAutomation = async (automationId: string) => {
    setActionLoading(true);
    try {
      const result = await categorization.automations.approveAutomation(automationId);
      if (result.success) {
        toast.success("Automation approved successfully");
        fetchAutomations();
        if (selectedAutomation?.id === automationId) {
          // Reload the selected automation to reflect changes
          const updatedAutomation = await categorization.automations.getAutomation(automationId);
          setSelectedAutomation(updatedAutomation);
        }
      } else {
        toast.error(`Failed to approve automation: ${result.error}`);
      }
    } catch (error) {
      console.error("Error approving automation:", error);
      toast.error("Failed to approve automation");
    } finally {
      setActionLoading(false);
    }
  };

  // Reject an automation
  const handleRejectAutomation = async (automationId: string) => {
    setActionLoading(true);
    try {
      const result = await categorization.automations.rejectAutomation(automationId);
      if (result.success) {
        toast.success("Automation rejected and changes reverted");
        fetchAutomations();
        if (selectedAutomation?.id === automationId) {
          // Reload the selected automation to reflect changes
          const updatedAutomation = await categorization.automations.getAutomation(automationId);
          setSelectedAutomation(updatedAutomation);
        }
      } else {
        toast.error(`Failed to reject automation: ${result.error}`);
      }
    } catch (error) {
      console.error("Error rejecting automation:", error);
      toast.error("Failed to reject automation");
    } finally {
      setActionLoading(false);
    }
  };
  
  // Revert an approved automation
  const handleRevertAutomation = async (automationId: string) => {
    setActionLoading(true);
    try {
      const result = await categorization.automations.revertAutomation(automationId);
      if (result.success) {
        toast.success("Automation reverted successfully");
        fetchAutomations();
        if (selectedAutomation?.id === automationId) {
          // Reload the selected automation to reflect changes
          const updatedAutomation = await categorization.automations.getAutomation(automationId);
          setSelectedAutomation(updatedAutomation);
        }
      } else {
        toast.error(`Failed to revert automation: ${result.error}`);
      }
    } catch (error) {
      console.error("Error reverting automation:", error);
      toast.error("Failed to revert automation");
    } finally {
      setActionLoading(false);
    }
  };
  
  // Get status badge styles based on automation status
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'reverted':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };
  
  // Get action status class based on action status
  const getActionStatusClass = (status?: string) => {
    switch (status) {
      case 'executing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'executed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'reverted':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };
  
  // Table columns definition
  const columns: TableColumn<CategorizationAutomation>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      className: "max-w-[30%]",
      headerClassName: "px-3 py-2",
      cell: (automation) => (
        <div className="font-medium truncate px-3 py-2" title={automation.name}>{automation.name}</div>
      )
    },
    {
      key: "source",
      header: "Source",
      sortable: true,
      className: "w-24",
      headerClassName: "px-3 py-2",
      cell: (automation) => (
        <div className="capitalize px-3 py-2">{automation.source}</div>
      )
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      className: "w-24",
      headerClassName: "px-3 py-2",
      cell: (automation) => (
        <div className="px-3 py-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(automation.status || 'pending')}`}>
            {automation.status || 'pending'}
          </span>
        </div>
      )
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      className: "w-28",
      headerClassName: "px-3 py-2",
      cell: (automation) => (
        <div className="px-3 py-2">{automation.createdAt ? new Date(automation.createdAt).toLocaleDateString() : "-"}</div>
      )
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      className: "w-[110px]",
      headerClassName: "px-3 py-2 text-right",
      cell: (automation) => (
        <div className="flex justify-end gap-1 px-3 py-2">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => automation.id && handleViewDetails(automation.id)}
            className="px-2 h-8"
            title="View Details"
          >
            <Info className="h-4 w-4" />
          </Button>
          
          {automation.status === 'pending' && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/30 px-2 h-8"
                onClick={() => automation.id && handleApproveAutomation(automation.id)}
                disabled={actionLoading}
                title="Approve"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30 px-2 h-8"
                onClick={() => automation.id && handleRejectAutomation(automation.id)}
                disabled={actionLoading}
                title="Reject"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {automation.status === 'approved' && (
            <Button
              variant="outline"
              size="sm"
              className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-900/30 px-2 h-8"
              onClick={() => automation.id && handleRevertAutomation(automation.id)}
              disabled={actionLoading}
              title="Revert"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 max-w-screen-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Context Automations</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage and review categorization automations for your content
        </p>
      </div>
      
      {/* Filters and Search */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full max-w-sm">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              id="search"
              type="text"
              placeholder="Search automations"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="w-full md:w-auto">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            id="status"
            value={statusFilter || ""}
            onChange={(e) => setStatusFilter(e.target.value || null)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="reverted">Reverted</option>
          </select>
        </div>
        
        <div className="w-full md:w-auto">
          <label htmlFor="source" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Source
          </label>
          <select
            id="source"
            value={sourceFilter || ""}
            onChange={(e) => setSourceFilter(e.target.value || null)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <option value="">All Sources</option>
            <option value="ai">AI</option>
            <option value="user">User</option>
            <option value="system">System</option>
          </select>
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => {
            setSearchTerm("");
            setStatusFilter(null);
            setSourceFilter(null);
          }}
          className="md:self-end"
        >
          Clear Filters
        </Button>
      </div>
      
      {/* Automations Table */}
      {loading ? (
        <LoadingPlaceholder text="Loading automations..." />
      ) : (
        <div className="mb-6 overflow-x-auto">
          <Table
            data={paginatedAutomations}
            columns={columns}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            isLoading={loading}
            tableClassName="w-full"
            bodyClassName="text-sm"
            emptyState={
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 mb-2">No automations found</p>
                {(searchTerm || statusFilter || sourceFilter) && (
                  <p className="text-gray-400 dark:text-gray-500 text-sm">
                    Try adjusting your search filters
                  </p>
                )}
              </div>
            }
          />
          
          {/* Pagination */}
          {filteredAutomations.length > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                pageCount={Math.ceil(filteredAutomations.length / itemsPerPage)}
                onPageChange={setCurrentPage}
                totalItems={filteredAutomations.length}
                limit={itemsPerPage}
                offset={(currentPage - 1) * itemsPerPage}
              />
            </div>
          )}
          
          <div className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
            Showing {Math.min(filteredAutomations.length, paginatedAutomations.length)} of {filteredAutomations.length} automations
          </div>
        </div>
      )}
      
      {/* Automation Details Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedAutomation?.name || "Automation Details"}
        size="lg"
      >
        {selectedAutomation ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</h3>
                <p className="text-base font-medium">{selectedAutomation.status || "pending"}</p>
              </div>
              
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Source</h3>
                <p className="text-base font-medium">{selectedAutomation.source}</p>
              </div>
              
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Created</h3>
                <p className="text-base font-medium">
                  {selectedAutomation.createdAt 
                    ? new Date(selectedAutomation.createdAt).toLocaleDateString() + " " + 
                      new Date(selectedAutomation.createdAt).toLocaleTimeString()
                    : "-"}
                </p>
              </div>
              
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Actions</h3>
                <p className="text-base font-medium">{selectedAutomation.actions.length}</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-base font-semibold mb-3">Actions</h3>
              
              {selectedAutomation.actions.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No actions in this automation</p>
              ) : (
                <ScrollArea className="h-[300px] border rounded-md dark:border-gray-700">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Resource</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                      {selectedAutomation.actions.map((action) => (
                        <tr key={action.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {action.actionData.action}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {(action.actionData.action === 'add_category' || action.actionData.action === 'add_tag') ? (
                              <span>{action.actionData.target}: {action.actionData.target_id}</span>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {action.actionData.action === 'create_category' && (
                              <span>Created category: {action.actionData.category_name}</span>
                            )}
                            {action.actionData.action === 'create_tag' && (
                              <span>Created tag: {action.actionData.tag_name}</span>
                            )}
                            {action.actionData.action === 'add_category' && (
                              <span>Added category ID: {action.actionData.category_id}</span>
                            )}
                            {action.actionData.action === 'add_tag' && (
                              <span>Added tag ID: {action.actionData.tag_id}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionStatusClass(action.status)}`}>
                              {action.status || 'pending'}
                            </span>
                            {action.executedAt && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {new Date(action.executedAt).toLocaleString()}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-end gap-3 border-t dark:border-gray-700 pt-4 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Close
              </Button>
              
              {selectedAutomation.status === 'pending' && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (selectedAutomation.id) {
                        handleRejectAutomation(selectedAutomation.id);
                        setShowModal(false);
                      }
                    }}
                    disabled={actionLoading}
                  >
                    <X className="h-4 w-4 mr-1" /> Reject
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      if (selectedAutomation.id) {
                        handleApproveAutomation(selectedAutomation.id);
                        setShowModal(false);
                      }
                    }}
                    disabled={actionLoading}
                  >
                    <Check className="h-4 w-4 mr-1" /> Approve
                  </Button>
                </>
              )}
              
              {selectedAutomation.status === 'approved' && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (selectedAutomation.id) {
                      handleRevertAutomation(selectedAutomation.id);
                      setShowModal(false);
                    }
                  }}
                  disabled={actionLoading}
                >
                  <RotateCcw className="h-4 w-4 mr-1" /> Revert
                </Button>
              )}
            </div>
          </div>
        ) : (
          <LoadingPlaceholder text="Loading automation details..." />
        )}
      </Modal>
    </div>
  );
} 