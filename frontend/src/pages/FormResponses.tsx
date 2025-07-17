import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Eye, ArrowLeft, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { formsAPI, responsesAPI } from '../services/api';
import { Form, Response, FormSummary } from '../types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const FormResponses: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [summary, setSummary] = useState<FormSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'summary'>('summary');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (id) {
      fetchForm();
      fetchSummary();
      fetchResponses();
    }
  }, [id, currentPage]);

  const fetchForm = async () => {
    try {
      const response = await formsAPI.getById(id!);
      setForm(response.form);
    } catch (error: any) {
      toast.error('Failed to load form');
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await responsesAPI.getSummary(id!);
      setSummary(response.summary);
    } catch (error: any) {
      toast.error('Failed to load summary');
    }
  };

  const fetchResponses = async () => {
    try {
      const response = await responsesAPI.getByForm(id!, { page: currentPage, limit: 20 });
      setResponses(response.responses);
      setTotalPages(response.totalPages);
    } catch (error: any) {
      toast.error('Failed to load responses');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const blob = await responsesAPI.exportCSV(id!);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${form?.title}-responses.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('CSV exported successfully!');
    } catch (error: any) {
      toast.error('Failed to export CSV');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Form not found</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/dashboard"
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{form.title}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {summary?.totalResponses || 0} responses
            </p>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={handleExportCSV}
            className="btn btn-outline btn-md"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex space-x-2">
        <button
          onClick={() => setViewMode('summary')}
          className={`btn btn-sm ${viewMode === 'summary' ? 'btn-primary' : 'btn-outline'}`}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Summary
        </button>
        <button
          onClick={() => setViewMode('table')}
          className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-outline'}`}
        >
          <Eye className="h-4 w-4 mr-2" />
          Responses
        </button>
      </div>

      {viewMode === 'summary' && summary && (
        <div className="space-y-6">
          {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="card-content">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BarChart3 className="h-8 w-8 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Responses</p>
                    <p className="text-2xl font-semibold text-gray-900">{summary.totalResponses}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Question Charts */}
          <div className="space-y-6">
            {summary.questions.map((question, index) => (
              <div key={question.questionId} className="card">
                <div className="card-header">
                  <h3 className="card-title">{question.questionText}</h3>
                  <p className="card-description">
                    {question.totalAnswers} responses
                  </p>
                </div>
                <div className="card-content">
                  {question.questionType === 'multiple-choice' && question.answers && (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={Object.entries(question.answers).map(([key, value]) => ({ name: key, value }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#3B82F6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'table' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">All Responses</h2>
            <p className="card-description">
              Page {currentPage} of {totalPages}
            </p>
          </div>
          <div className="card-content">
            {responses.length === 0 ? (
              <div className="text-center py-12">
                <Eye className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No responses yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Share your form to start collecting responses.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      {form.settings.requireEmail && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                      )}
                      {form.questions.map((question) => (
                        <th key={question._id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {question.text}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {responses.map((response) => (
                      <tr key={response._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(response.submittedAt).toLocaleString()}
                        </td>
                        {form.settings.requireEmail && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {response.submitterEmail || '-'}
                          </td>
                        )}
                        {form.questions.map((question) => {
                          const answer = response.answers.find(a => a.questionId === question._id);
                          return (
                            <td key={question._id} className="px-6 py-4 text-sm text-gray-900">
                              {answer ? (
                                <div className="max-w-xs truncate" title={answer.answer}>
                                  {answer.answer}
                                </div>
                              ) : (
                                '-'
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="btn btn-outline btn-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="btn btn-outline btn-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FormResponses; 