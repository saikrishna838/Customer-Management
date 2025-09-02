import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { customerAPI } from '../services/api';

const CustomerListPage = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [cityFilter, setCityFilter] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 1
    });

    useEffect(() => {
        fetchCustomers();
    }, [pagination.page, searchTerm, cityFilter]);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const params = {
                page: pagination.page,
                limit: pagination.limit
            };
            
            if (searchTerm.trim()) {
                params.search = searchTerm.trim();
            }
            
            if (cityFilter.trim()) {
                params.city = cityFilter.trim();
            }
            
            const response = await customerAPI.getAll(params);
            setCustomers(response.data.customers);
            setPagination(prev => ({
                ...prev,
                ...response.data.pagination
            }));
        } catch (err) {
            console.error('Error fetching customers:', err);
            setError('Failed to fetch customers. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchCustomers();
    };

    const handleDeleteCustomer = async (customerId) => {
        if (window.confirm('Are you sure you want to delete this customer? This will also delete all their addresses.')) {
            try {
                await customerAPI.delete(customerId);
                fetchCustomers(); // Refresh the list
            } catch (err) {
                console.error('Error deleting customer:', err);
                alert('Failed to delete customer. Please try again.');
            }
        }
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const renderPagination = () => {
        if (pagination.pages <= 1) return null;

        const pages = [];
        for (let i = 1; i <= pagination.pages; i++) {
            pages.push(
                <button
                    key={i}
                    className={`pagination-btn ${i === pagination.page ? 'active' : ''}`}
                    onClick={() => handlePageChange(i)}
                >
                    {i}
                </button>
            );
        }

        return (
            <div className="pagination">
                <button
                    disabled={pagination.page === 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                >
                    Previous
                </button>
                {pages}
                <button
                    disabled={pagination.page === pagination.pages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                >
                    Next
                </button>
            </div>
        );
    };

    return (
        <div>
            <h1 className="page-title">Customer Management</h1>
            
            {/* Search and Filter Section */}
            <div className="search-filters">
                <form onSubmit={handleSearch}>
                    <div className="search-row">
                        <div className="form-group">
                            <label className="form-label">Search Customers</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Filter by City</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter city name..."
                                value={cityFilter}
                                onChange={(e) => setCityFilter(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <button type="submit" className="btn btn-primary">
                                Search
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Add Customer Button */}
            <div style={{ marginBottom: '1rem' }}>
                <Link to="/customers/new" className="btn btn-primary">
                    Add New Customer
                </Link>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="loading">
                    <p>Loading customers...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="card" style={{ backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' }}>
                    <p>{error}</p>
                    <button onClick={fetchCustomers} className="btn btn-primary btn-sm">
                        Retry
                    </button>
                </div>
            )}

            {/* Customer List */}
            {!loading && !error && (
                <>
                    {customers.length === 0 ? (
                        <div className="empty-state">
                            <h3>No customers found</h3>
                            <p>
                                {searchTerm || cityFilter 
                                    ? 'Try adjusting your search criteria or clear the filters.'
                                    : 'Get started by adding your first customer.'
                                }
                            </p>
                            <Link to="/customers/new" className="btn btn-primary">
                                Add Customer
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="card">
                                <div className="table-container">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Phone</th>
                                                <th>Created</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {customers.map((customer) => (
                                                <tr key={customer.id}>
                                                    <td>
                                                        <Link 
                                                            to={`/customers/${customer.id}`}
                                                            style={{ color: '#007bff', textDecoration: 'none' }}
                                                        >
                                                            {customer.name}
                                                        </Link>
                                                    </td>
                                                    <td>{customer.email}</td>
                                                    <td>{customer.phone || 'N/A'}</td>
                                                    <td>
                                                        {new Date(customer.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td>
                                                        <div className="btn-group">
                                                            <Link
                                                                to={`/customers/${customer.id}`}
                                                                className="btn btn-secondary btn-sm"
                                                            >
                                                                View
                                                            </Link>
                                                            <Link
                                                                to={`/customers/${customer.id}/edit`}
                                                                className="btn btn-primary btn-sm"
                                                            >
                                                                Edit
                                                            </Link>
                                                            <button
                                                                onClick={() => handleDeleteCustomer(customer.id)}
                                                                className="btn btn-danger btn-sm"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Pagination */}
                            {renderPagination()}

                            {/* Results Info */}
                            <div style={{ textAlign: 'center', marginTop: '1rem', color: '#666' }}>
                                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                                {pagination.total} customers
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default CustomerListPage;
