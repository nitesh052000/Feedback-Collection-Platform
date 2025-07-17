import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText, BarChart3, Share2, Eye, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formsAPI } from '../services/api';
import { Form } from '../types';

const Dashboard: React.FC = () => {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const response = await formsAPI.getAll();
      setForms(response.forms || []);
    } catch (error: any) {
      toast.error('Failed to load forms');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (window.confirm('Are you sure you want to delete this form?')) {
      try {
        await formsAPI.delete(formId);
        toast.success('Form deleted successfully');
        fetchForms();
      } catch (error: any) {
        toast.error('Failed to delete form');
      }
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/form/${url}`);
    toast.success('Form link copied to clipboard!');
  };

  const filteredForms = forms.filter(form =>
    form.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your feedback forms and view responses
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/forms/create"
            className="btn btn-primary btn-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Form
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <input
          type="text"
          placeholder="Search forms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Forms</p>
                <p className="text-2xl font-semibold text-gray-900">{forms.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Forms</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {forms.filter(f => f.isActive).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Responses</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {forms.reduce((sum, form) => sum + (form.responseCount || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forms List */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Your Forms</h2>
          <p className="card-description">
            {filteredForms.length === 0 ? 'No forms found' : `${filteredForms.length} form${filteredForms.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="card-content">
          {filteredForms.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No forms</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first feedback form.
              </p>
              <div className="mt-6">
                <Link
                  to="/forms/create"
                  className="btn btn-primary btn-md"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Form
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Form
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Responses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredForms.map((form) => (
                    <tr key={form._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {form.title}
                          </div>
                          {form.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {form.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          form.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {form.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {form.responseCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(form.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => copyToClipboard(form.publicUrl)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Copy form link"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                          <Link
                            to={`/forms/${form._id}/responses`}
                            className="text-gray-400 hover:text-gray-600"
                            title="View responses"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/forms/${form._id}/edit`}
                            className="text-gray-400 hover:text-gray-600"
                            title="Edit form"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteForm(form._id)}
                            className="text-gray-400 hover:text-red-600"
                            title="Delete form"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 