"use client";

import { useState, useEffect, useMemo } from "react";
import { useCategorization } from "@/lib/categorization";
import { CategorizationJob } from "@/lib/categorization/types";
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

export default function ContextJobsPage() {
  // State for jobs data and UI
  const [jobs, setJobs] = useState<CategorizationJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<CategorizationJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<CategorizationJob | null>(null);
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

  // Fetch jobs on component mount
  useEffect(() => {
    fetchJobs();
  }, []);
  
  // Filter and sort jobs when dependencies change
  useEffect(() => {
    let result = [...jobs];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(job => 
        job.name.toLowerCase().includes(term) || 
        job.source.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      result = result.filter(job => job.status === statusFilter);
    }
    
    // Apply source filter
    if (sourceFilter) {
      result = result.filter(job => job.source === sourceFilter);
    }
    
    // Sort the results
    result = sortJobs(result, sortField, sortDirection);
    
    setFilteredJobs(result);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [jobs, searchTerm, statusFilter, sourceFilter, sortField, sortDirection]);
  
  // Calculate paginated data
  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredJobs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredJobs, currentPage, itemsPerPage]);
  
  // Helper functions
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const fetchedJobs = await categorization.jobs.getJobs();
      setJobs(fetchedJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load context jobs");
    } finally {
      setLoading(false);
    }
  };
  
  const sortJobs = (jobsToSort: CategorizationJob[], field: string, direction: SortDirection) => {
    return [...jobsToSort].sort((a, b) => {
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

  // View job details
  const handleViewDetails = async (jobId: string) => {
    try {
      const job = await categorization.jobs.getJob(jobId);
      setSelectedJob(job);
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching job details:", error);
      toast.error("Failed to load job details");
    }
  };

  // Approve a job
  const handleApproveJob = async (jobId: string) => {
    setActionLoading(true);
    try {
      const result = await categorization.jobs.approveJob(jobId);
      if (result.success) {
        toast.success("Job approved successfully");
        fetchJobs();
        if (selectedJob?.id === jobId) {
          // Reload the selected job to reflect changes
          const updatedJob = await categorization.jobs.getJob(jobId);
          setSelectedJob(updatedJob);
        }
      } else {
        toast.error(`Failed to approve job: ${result.error}`);
      }
    } catch (error) {
      console.error("Error approving job:", error);
      toast.error("Failed to approve job");
    } finally {
      setActionLoading(false);
    }
  };

  // Reject a job
  const handleRejectJob = async (jobId: string) => {
    setActionLoading(true);
    try {
      const result = await categorization.jobs.rejectJob(jobId);
      if (result.success) {
        toast.success("Job rejected and changes reverted");
        fetchJobs();
        if (selectedJob?.id === jobId) {
          // Reload the selected job to reflect changes
          const updatedJob = await categorization.jobs.getJob(jobId);
          setSelectedJob(updatedJob);
        }
      } else {
        toast.error(`Failed to reject job: ${result.error}`);
      }
    } catch (error) {
      console.error("Error rejecting job:", error);
      toast.error("Failed to reject job");
    } finally {
      setActionLoading(false);
    }
  };
  
  // Revert an approved job
  const handleRevertJob = async (jobId: string) => {
    setActionLoading(true);
    try {
      const result = await categorization.jobs.revertJob(jobId);
      if (result.success) {
        toast.success("Job reverted successfully");
        fetchJobs();
        if (selectedJob?.id === jobId) {
          // Reload the selected job to reflect changes
          const updatedJob = await categorization.jobs.getJob(jobId);
          setSelectedJob(updatedJob);
        }
      } else {
        toast.error(`Failed to revert job: ${result.error}`);
      }
    } catch (error) {
      console.error("Error reverting job:", error);
      toast.error("Failed to revert job");
    } finally {
      setActionLoading(false);
    }
  };
  
  // Get status badge styles based on job status
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
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
  const columns: TableColumn<CategorizationJob>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      className: "max-w-[30%]",
      headerClassName: "px-3 py-2",
      cell: (job) => (
        <div className="font-medium truncate px-3 py-2" title={job.name}>{job.name}</div>
      )
    },
    {
      key: "source",
      header: "Source",
      sortable: true,
      className: "w-24",
      headerClassName: "px-3 py-2",
      cell: (job) => (
        <div className="capitalize px-3 py-2">{job.source}</div>
      )
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      className: "w-24",
      headerClassName: "px-3 py-2",
      cell: (job) => (
        <div className="px-3 py-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(job.status || 'pending')}`}>
            {job.status || 'pending'}
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
      cell: (job) => (
        <div className="px-3 py-2">{job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "-"}</div>
      )
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      className: "w-[110px]",
      headerClassName: "px-3 py-2 text-right",
      cell: (job) => (
        <div className="flex justify-end gap-1 px-3 py-2">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => job.id && handleViewDetails(job.id)}
            className="px-2 h-8"
            title="View Details"
          >
            <Info className="h-4 w-4" />
          </Button>
          
          {job.status === 'pending' && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/30 px-2 h-8"
                onClick={() => job.id && handleApproveJob(job.id)}
                disabled={actionLoading}
                title="Approve"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30 px-2 h-8"
                onClick={() => job.id && handleRejectJob(job.id)}
                disabled={actionLoading}
                title="Reject"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {job.status === 'approved' && (
            <Button
              variant="outline"
              size="sm"
              className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-900/30 px-2 h-8"
              onClick={() => job.id && handleRevertJob(job.id)}
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
        <h1 className="text-2xl font-bold mb-2">Context Jobs</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage and review categorization jobs for your content
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
              placeholder="Search jobs"
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
      
      {/* Jobs Table */}
      {loading ? (
        <LoadingPlaceholder text="Loading jobs..." />
      ) : (
        <div className="mb-6 overflow-x-auto">
          <Table
            data={paginatedJobs}
            columns={columns}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            isLoading={loading}
            tableClassName="w-full"
            bodyClassName="text-sm"
            emptyState={
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 mb-2">No jobs found</p>
                {(searchTerm || statusFilter || sourceFilter) && (
                  <p className="text-gray-400 dark:text-gray-500 text-sm">
                    Try adjusting your search filters
                  </p>
                )}
              </div>
            }
          />
          
          {/* Pagination */}
          {filteredJobs.length > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                pageCount={Math.ceil(filteredJobs.length / itemsPerPage)}
                onPageChange={setCurrentPage}
                totalItems={filteredJobs.length}
                limit={itemsPerPage}
                offset={(currentPage - 1) * itemsPerPage}
              />
            </div>
          )}
          
          <div className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
            Showing {Math.min(filteredJobs.length, paginatedJobs.length)} of {filteredJobs.length} jobs
          </div>
        </div>
      )}
      
      {/* Job Details Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedJob?.name || "Job Details"}
        size="lg"
      >
        {selectedJob ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</h3>
                <p className="text-base font-medium">{selectedJob.status || "pending"}</p>
              </div>
              
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Source</h3>
                <p className="text-base font-medium">{selectedJob.source}</p>
              </div>
              
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Created</h3>
                <p className="text-base font-medium">
                  {selectedJob.createdAt 
                    ? new Date(selectedJob.createdAt).toLocaleDateString() + " " + 
                      new Date(selectedJob.createdAt).toLocaleTimeString()
                    : "-"}
                </p>
              </div>
              
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Actions</h3>
                <p className="text-base font-medium">{selectedJob.actions.length}</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-base font-semibold mb-3">Actions</h3>
              
              {selectedJob.actions.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No actions in this job</p>
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
                      {selectedJob.actions.map((action) => (
                        <tr key={action.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {action.actionType}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {action.resource ? (
                              <span>{action.resource.type}: {action.resource.id}</span>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {action.actionType === 'create_category' && (
                              <span>Created category: {action.categoryName}</span>
                            )}
                            {action.actionType === 'create_tag' && (
                              <span>Created tag: {action.tagName}</span>
                            )}
                            {action.actionType === 'add_category' && (
                              <span>Added category ID: {action.categoryId}</span>
                            )}
                            {action.actionType === 'add_tag' && (
                              <span>Added tag ID: {action.tagId}</span>
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
              
              {selectedJob.status === 'pending' && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (selectedJob.id) {
                        handleRejectJob(selectedJob.id);
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
                      if (selectedJob.id) {
                        handleApproveJob(selectedJob.id);
                        setShowModal(false);
                      }
                    }}
                    disabled={actionLoading}
                  >
                    <Check className="h-4 w-4 mr-1" /> Approve
                  </Button>
                </>
              )}
              
              {selectedJob.status === 'approved' && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (selectedJob.id) {
                      handleRevertJob(selectedJob.id);
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
          <LoadingPlaceholder text="Loading job details..." />
        )}
      </Modal>
    </div>
  );
} 