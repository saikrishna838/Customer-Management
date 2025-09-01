import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { customerAPI, addressAPI } from '../services/api';

const CustomerDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [addressFormData, setAddressFormData] = useState({
        street: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'USA',
        address_type: 'home'
    });

    useEffect(() => {
        fetchCustomerAndAddresses();
    }, [id]);

    const fetchCustomerAndAddresses = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch customer details and addresses in parallel
            const [customerResponse, addressesResponse] = await Promise.all([
                customerAPI.getById(id),
                addressAPI.getByCustomerId(id)
            ]);
            
            setCustomer(customerResponse.data);
            setAddresses(addressesResponse.data);
        } catch (err) {
            console.error('Error fetching customer details:', err);
            if (err.response?.status === 404) {
                setError('Customer not found.');
            } else {
                setError('Failed to fetch customer details. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCustomer = async () => {
        if (window.confirm('Are you sure you want to delete this customer? This will also delete all their addresses.')) {
            try {
                await customerAPI.delete(id);
                navigate('/', { replace: true });
            } catch (err) {
                console.error('Error deleting customer:', err);
                alert('Failed to delete customer. Please try again.');
            }
        }
    };

    const handleDeleteAddress = async (addressId) => {
        if (window.confirm('Are you sure you want to delete this address?')) {
            try {
                await addressAPI.delete(addressId);
                setAddresses(addresses.filter(addr => addr.id !== addressId));
            } catch (err) {
                console.error('Error deleting address:', err);
                alert('Failed to delete address. Please try again.');
            }
        }
    };

    const handleAddressFormSubmit = async (e) => {
        e.preventDefault();
        
        // Basic validation
        const { street, city, state, zip_code } = addressFormData;
        if (!street.trim() || !city.trim() || !state.trim() || !zip_code.trim()) {
            alert('Please fill in all required fields (street, city, state, zip code).');
            return;
        }

        try {
            let updatedAddress;
            if (editingAddress) {
                // Update existing address
                const response = await addressAPI.update(editingAddress.id, addressFormData);
                updatedAddress = response.data;
                setAddresses(addresses.map(addr => 
                    addr.id === editingAddress.id ? updatedAddress : addr
                ));
            } else {
                // Create new address
                const response = await addressAPI.create(id, addressFormData);
                updatedAddress = response.data;
                setAddresses([updatedAddress, ...addresses]);
            }
            
            // Reset form
            setShowAddressForm(false);
            setEditingAddress(null);
            setAddressFormData({
                street: '',
                city: '',
                state: '',
                zip_code: '',
                country: 'USA',
                address_type: 'home'
            });
        } catch (err) {
            console.error('Error saving address:', err);
            alert(err.response?.data?.error || 'Failed to save address. Please try again.');
        }
    };

    const startEditingAddress = (address) => {
        setEditingAddress(address);
        setAddressFormData({
            street: address.street,
            city: address.city,
            state: address.state,
            zip_code: address.zip_code,
            country: address.country,
            address_type: address.address_type
        });
        setShowAddressForm(true);
    };

    const cancelAddressForm = () => {
        setShowAddressForm(false);
        setEditingAddress(null);
        setAddressFormData({
            street: '',
            city: '',
            state: '',
            zip_code: '',
            country: 'USA',
            address_type: 'home'
        });
    };

    if (loading) {
        return (
            <div className="loading">
                <p>Loading customer details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card" style={{ backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' }}>
                <p>{error}</p>
                <div>
                    <Link to="/" className="btn btn-primary btn-sm">
                        Back to Customers
                    </Link>
                    <button onClick={fetchCustomerAndAddresses} className="btn btn-secondary btn-sm" style={{ marginLeft: '0.5rem' }}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Breadcrumb */}
            <div style={{ marginBottom: '1rem' }}>
                <Link to="/" style={{ color: '#007bff', textDecoration: 'none' }}>← Back to Customers</Link>
            </div>

            {/* Customer Information */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <h1 className="page-title" style={{ margin: 0 }}>{customer.name}</h1>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link to={`/customers/${customer.id}/edit`} className="btn btn-primary">
                            Edit Customer
                        </Link>
                        <button onClick={handleDeleteCustomer} className="btn btn-danger">
                            Delete Customer
                        </button>
                    </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                        <strong>Email:</strong>
                        <p style={{ margin: '0.25rem 0' }}>{customer.email}</p>
                    </div>
                    <div>
                        <strong>Phone:</strong>
                        <p style={{ margin: '0.25rem 0' }}>{customer.phone || 'N/A'}</p>
                    </div>
                    <div>
                        <strong>Created:</strong>
                        <p style={{ margin: '0.25rem 0' }}>
                            {new Date(customer.created_at).toLocaleDateString()}
                        </p>
                    </div>
                    <div>
                        <strong>Last Updated:</strong>
                        <p style={{ margin: '0.25rem 0' }}>
                            {new Date(customer.updated_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Addresses Section */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ margin: 0 }}>Addresses ({addresses.length})</h2>
                    <button
                        onClick={() => setShowAddressForm(true)}
                        className="btn btn-primary"
                    >
                        Add Address
                    </button>
                </div>

                {/* Address Form */}
                {showAddressForm && (
                    <div style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0' }}>
                            {editingAddress ? 'Edit Address' : 'Add New Address'}
                        </h3>
                        <form onSubmit={handleAddressFormSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Street Address *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={addressFormData.street}
                                        onChange={(e) => setAddressFormData({ ...addressFormData, street: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">City *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={addressFormData.city}
                                        onChange={(e) => setAddressFormData({ ...addressFormData, city: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">State *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={addressFormData.state}
                                        onChange={(e) => setAddressFormData({ ...addressFormData, state: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">ZIP Code *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={addressFormData.zip_code}
                                        onChange={(e) => setAddressFormData({ ...addressFormData, zip_code: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Country</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={addressFormData.country}
                                        onChange={(e) => setAddressFormData({ ...addressFormData, country: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Address Type</label>
                                    <select
                                        className="form-control"
                                        value={addressFormData.address_type}
                                        onChange={(e) => setAddressFormData({ ...addressFormData, address_type: e.target.value })}
                                    >
                                        <option value="home">Home</option>
                                        <option value="work">Work</option>
                                        <option value="billing">Billing</option>
                                        <option value="shipping">Shipping</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                <button type="submit" className="btn btn-primary">
                                    {editingAddress ? 'Update Address' : 'Add Address'}
                                </button>
                                <button type="button" onClick={cancelAddressForm} className="btn btn-secondary">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Address List */}
                {addresses.length === 0 ? (
                    <div className="empty-state">
                        <h3>No addresses found</h3>
                        <p>This customer doesn't have any addresses yet.</p>
                        <button
                            onClick={() => setShowAddressForm(true)}
                            className="btn btn-primary"
                        >
                            Add First Address
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                        {addresses.map((address) => (
                            <div key={address.id} style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '4px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                    <span style={{ 
                                        backgroundColor: '#007bff', 
                                        color: 'white', 
                                        padding: '0.25rem 0.5rem', 
                                        borderRadius: '4px', 
                                        fontSize: '0.8rem',
                                        textTransform: 'capitalize'
                                    }}>
                                        {address.address_type}
                                    </span>
                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                        <button
                                            onClick={() => startEditingAddress(address)}
                                            className="btn btn-primary btn-sm"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteAddress(address.id)}
                                            className="btn btn-danger btn-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <p style={{ margin: '0.25rem 0' }}>{address.street}</p>
                                    <p style={{ margin: '0.25rem 0' }}>
                                        {address.city}, {address.state} {address.zip_code}
                                    </p>
                                    <p style={{ margin: '0.25rem 0', color: '#666' }}>{address.country}</p>
                                    <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#666' }}>
                                        Added: {new Date(address.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerDetailPage;
