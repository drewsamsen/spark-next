"use client";

import { useState, useEffect } from "react";
import { useCategorization } from "@/lib/categorization";
import { CategorizationJob } from "@/lib/categorization/types";
import { toast } from "react-toastify";
import { Check, X } from "lucide-react";

export default function ContextJobsPage() {
  const [jobs, setJobs] = useState<CategorizationJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<CategorizationJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const categorization = useCategorization();

  // Fetch jobs on component mount
  useEffect(() => {
    async function fetchJobs() {
      try {
        const fetchedJobs = await categorization.jobs.getJobs();
        setJobs(fetchedJobs);
      } catch (error) {
        console.error("Error fetching jobs:", error);
        toast.error("Failed to load context jobs");
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, [categorization.jobs]);

  // Load job details when a job is selected
  const handleJobSelect = async (jobId: string) => {
    try {
      const job = await categorization.jobs.getJob(jobId);
      setSelectedJob(job);
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
        // Refresh jobs list and clear selected job
        const updatedJobs = await categorization.jobs.getJobs();
        setJobs(updatedJobs);
        setSelectedJob(null);
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
        // Refresh jobs list and clear selected job
        const updatedJobs = await categorization.jobs.getJobs();
        setJobs(updatedJobs);
        setSelectedJob(null);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Context Jobs</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Jobs List */}
          <div className="md:col-span-1 border rounded-lg p-4 dark:border-spark-dark-neutral/20">
            <h2 className="text-xl font-semibold mb-4">Jobs</h2>
            
            {jobs.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No jobs found</p>
            ) : (
              <ul className="space-y-2">
                {jobs.map((job) => (
                  <li 
                    key={job.id} 
                    className={`p-3 rounded-md cursor-pointer border ${
                      selectedJob?.id === job.id 
                        ? 'bg-spark-neutral/10 border-spark-primary dark:bg-spark-dark-neutral/20 dark:border-spark-dark-primary' 
                        : 'hover:bg-spark-neutral/5 dark:hover:bg-spark-dark-neutral/10 border-transparent'
                    }`}
                    onClick={() => job.id && handleJobSelect(job.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{job.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Source: {job.source}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {job.createdAt && new Date(job.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(job.status || 'pending')}`}>
                        {job.status || 'pending'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Job Details */}
          <div className="md:col-span-2 border rounded-lg p-4 dark:border-spark-dark-neutral/20">
            {selectedJob ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">{selectedJob.name}</h2>
                  
                  {selectedJob.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => selectedJob.id && handleApproveJob(selectedJob.id)}
                        disabled={actionLoading}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded-md dark:bg-green-900 dark:hover:bg-green-800 dark:text-green-200"
                      >
                        <Check size={16} />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => selectedJob.id && handleRejectJob(selectedJob.id)}
                        disabled={actionLoading}
                        className="flex items-center space-x-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-md dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-200"
                      >
                        <X size={16} />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-gray-50 p-2 rounded dark:bg-gray-800">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                    <p className="font-medium">{selectedJob.status}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded dark:bg-gray-800">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Source</span>
                    <p className="font-medium">{selectedJob.source}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded dark:bg-gray-800">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Date Created</span>
                    <p className="font-medium">
                      {selectedJob.createdAt && new Date(selectedJob.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded dark:bg-gray-800">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Actions</span>
                    <p className="font-medium">{selectedJob.actions.length}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Actions</h3>
                  {selectedJob.actions.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No actions in this job</p>
                  ) : (
                    <div className="max-h-96 overflow-y-auto border rounded dark:border-spark-dark-neutral/20">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action Type</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Resource</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                          {selectedJob.actions.map((action) => (
                            <tr key={action.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="px-4 py-2 whitespace-nowrap text-sm">
                                {action.actionType}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm">
                                {action.resource ? (
                                  <span>{action.resource.type}: {action.resource.id}</span>
                                ) : (
                                  <span className="text-gray-400">N/A</span>
                                )}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm">
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
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center h-64 text-gray-500 dark:text-gray-400">
                <p>Select a job to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 