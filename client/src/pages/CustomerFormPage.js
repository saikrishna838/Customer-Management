import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { customerAPI } from '../services/api';

const CustomerFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isEditing) {
            fetchCustomer();
        }
    }, [id, isEditing]);

    const fetchCustomer = async () => {
        try {
            setLoading(true);
            const response = await customerAPI.getById(id);
            const customer = response.data;
            setFormData({
                name: customer.name,
                email: customer.email,
                phone: customer.phone || ''
            });
        } catch (err) {
            console.error('Error fetching customer:', err);
            if (err.response?.status === 404) {
                alert('Customer not found.');
                navigate('/', { replace: true });
            } else {
                alert('Failed to fetch customer data. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters long';
        }

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Phone validation (optional, but if provided should be valid)
        if (formData.phone.trim() && !/^[\d\s\-\+\(\)\.]+$/.test(formData.phone.trim())) {
            newErrors.phone = 'Please enter a valid phone number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSaving(true);
        setErrors({});

        try {
            const customerData = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim() || null
            };

            let response;
            if (isEditing) {
                response = await customerAPI.update(id, customerData);
            } else {
                response = await customerAPI.create(customerData);
            }

            const customer = response.data;
            
            // Navigate to customer detail page
            navigate(`/customers/${customer.id}`, { 
                replace: true,
                state: { message: `Customer ${isEditing ? 'updated' : 'created'} successfully!` }
            });
        } catch (err) {
            console.error('Error saving customer:', err);
            
            if (err.response?.data?.error) {
                if (err.response.data.error.includes('Email already exists')) {
                    setErrors({ email: 'This email address is already in use by another customer' });
                } else if (err.response.data.error.includes('required')) {
                    setErrors({ general: 'Please fill in all required fields' });
                } else {
                    setErrors({ general: err.response.data.error });
                }
            } else {
                setErrors({ 
                    general: `Failed to ${isEditing ? 'update' : 'create'} customer. Please try again.`
                });
            }
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    if (loading) {
        return (
            <div className="loading">
                <p>Loading customer data...</p>
            </div>
        );
    }

    return (
        <div>
            {/* Breadcrumb */}
            <div style={{ marginBottom: '1rem' }}>
                <Link to="/" style={{ color: '#007bff', textDecoration: 'none' }}>
                    ← Back to Customers
                </Link>
                {isEditing && (
                    <>
                        <span style={{ margin: '0 0.5rem', color: '#666' }}>•</span>
                        <Link to={`/customers/${id}`} style={{ color: '#007bff', textDecoration: 'none' }}>
                            Customer Details
                        </Link>
                    </>
                )}
            </div>

            <div className="card">
                <h1 className="page-title">
                    {isEditing ? 'Edit Customer' : 'Add New Customer'}
                </h1>

                {/* General error message */}
                {errors.general && (
                    <div style={{ 
                        backgroundColor: '#f8d7da', 
                        color: '#721c24', 
                        padding: '0.75rem', 
                        borderRadius: '4px', 
                        border: '1px solid #f5c6cb',
                        marginBottom: '1rem'
                    }}>
                        {errors.general}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                        {/* Name Field */}
                        <div className="form-group">
                            <label className="form-label">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                className={`form-control ${errors.name ? 'error' : ''}`}
                                placeholder="Enter customer's full name"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                disabled={saving}
                                style={errors.name ? { borderColor: '#dc3545' } : {}}
                            />
                            {errors.name && (
                                <div className="form-error">{errors.name}</div>
                            )}
                        </div>

                        {/* Email Field */}
                        <div className="form-group">
                            <label className="form-label">
                                Email Address *
                            </label>
                            <input
                                type="email"
                                className={`form-control ${errors.email ? 'error' : ''}`}
                                placeholder="Enter email address"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                disabled={saving}
                                style={errors.email ? { borderColor: '#dc3545' } : {}}
                            />
                            {errors.email && (
                                <div className="form-error">{errors.email}</div>
                            )}
                        </div>

                        {/* Phone Field */}
                        <div className="form-group">
                            <label className="form-label">
                                Phone Number
                                <span style={{ color: '#666', fontSize: '0.9rem' }}> (optional)</span>
                            </label>
                            <input
                                type="tel"
                                className={`form-control ${errors.phone ? 'error' : ''}`}
                                placeholder="Enter phone number"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                disabled={saving}
                                style={errors.phone ? { borderColor: '#dc3545' } : {}}
                            />
                            {errors.phone && (
                                <div className="form-error">{errors.phone}</div>
                            )}
                            <small style={{ color: '#666', fontSize: '0.8rem' }}>
                                Format: (123) 456-7890 or 123-456-7890
                            </small>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div style={{ 
                        marginTop: '2rem', 
                        paddingTop: '1rem', 
                        borderTop: '1px solid #eee',
                        display: 'flex', 
                        gap: '0.5rem',
                        justifyContent: 'flex-start'
                    }}>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    {isEditing ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                <>
                                    {isEditing ? 'Update Customer' : 'Create Customer'}
                                </>
                            )}
                        </button>
                        
                        <Link
                            to={isEditing ? `/customers/${id}` : '/'}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </Link>
                    </div>

                    {/* Required fields note */}
                    <div style={{ marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
                        * Required fields
                    </div>
                </form>
            </div>

            {/* Tips for editing */}
            {isEditing && (
                <div className="card" style={{ marginTop: '1rem', backgroundColor: '#f8f9fa' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>💡 Tips</h3>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                        <li>Changing the email will update the customer's login credentials</li>
                        <li>Phone number is optional but recommended for better communication</li>
                        <li>All customer addresses will remain unchanged when updating customer info</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CustomerFormPage;
