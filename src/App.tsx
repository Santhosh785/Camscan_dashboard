import { useState, useEffect } from 'react'
import {
  BarChart3,
  Database,
  FileSpreadsheet,
  LayoutDashboard,
  PlusCircle,
  Settings,
  TrendingUp,
  Users,
  Search,
  Download,
  Filter,
  ArrowUpRight,
  Trash2,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const API_URL = '/api'

interface RentalData {
  _id?: string;
  slNo: string;
  name: string;
  phone: string;
  perDayRent: number;
  rentDate: string;
  timeOut: string;
  product: string;
  returnDate: string;
  advanceAmt: number;
  totalAmount: number;
}

const mockData: RentalData[] = [
  // { slNo: '1231', name: 'ANANTHAKRISHNA R', phone: '9037132505', perDayRent: 2250, rentDate: '2/2/2026', timeOut: '12:30 PM', product: 'SONY A7 MIV/ SIGMA 50 MM 1.4', returnDate: '9/2/26', advanceAmt: 0, totalAmount: 4500 },
  // { slNo: '1232', name: 'csi kottayam', phone: '7736311697', perDayRent: 3200, rentDate: '26-01-2026', timeOut: '', product: 'canon 70-300mm,viltrox r11cef adaptor', returnDate: '', advanceAmt: 0, totalAmount: 8000 },
  // { slNo: '1233', name: 'JIJO', phone: '9447736465', perDayRent: 0, rentDate: '2/2/2026', timeOut: '3.11 PM', product: 'INSTA 360*3/NEW STICK', returnDate: '3/2/2026', advanceAmt: 0, totalAmount: 2500 }
];

export default function App() {
  const [data, setData] = useState<RentalData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [connectionError, setConnectionError] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [formData, setFormData] = useState<Partial<RentalData>>({
    slNo: '',
    name: '',
    phone: '',
    perDayRent: 0,
    rentDate: '',
    timeOut: '',
    product: '',
    returnDate: '',
    advanceAmt: 0,
    totalAmount: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_URL}/rentals`);
      if (response.data.length > 0) {
        setData(response.data);
        setConnectionError(false);
        setIsUsingMockData(false);
      } else {
        setData(mockData);
        setConnectionError(false);
        setIsUsingMockData(true);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setData(mockData);
      setConnectionError(true);
      setIsUsingMockData(true);
    }
  };

  const handleAddRental = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/rentals`, formData);
      await fetchData();
      setShowAddModal(false);
      // Reset form
      setFormData({
        slNo: '',
        name: '',
        phone: '',
        perDayRent: 0,
        rentDate: '',
        timeOut: '',
        product: '',
        returnDate: '',
        advanceAmt: 0,
        totalAmount: 0
      });
    } catch (err) {
      console.error('Error adding rental:', err);
      alert('Failed to add rental. Please check your connection and try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['perDayRent', 'advanceAmt', 'totalAmount'].includes(name)
        ? parseFloat(value) || 0
        : value
    }));
  };

  const handleDeleteRental = async (id: string | undefined, slNo: string) => {
    console.log('Delete clicked - ID:', id, 'SlNo:', slNo, 'Using mock:', isUsingMockData);

    // Temporarily disabled confirmation for testing
    // if (!confirm('Are you sure you want to delete this rental?')) {
    //   return;
    // }

    try {
      if (isUsingMockData || !id) {
        // For mock data or missing ID, delete locally
        console.log('Deleting locally');
        setData(prevData => prevData.filter(item => item.slNo !== slNo));
      } else {
        // For database data, use API
        console.log('Deleting from API:', `${API_URL}/rentals/${id}`);
        const response = await axios.delete(`${API_URL}/rentals/${id}`);
        console.log('Delete successful:', response.data);
        await fetchData();
      }
    } catch (err) {
      console.error('Error deleting rental:', err);
      alert(`Failed to delete rental: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = data.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalRentals = data.length;
  const avgDailyRate = totalRentals > 0
    ? data.reduce((acc, curr) => acc + curr.perDayRent, 0) / totalRentals
    : 0;

  // Extract unique clients with their statistics
  const clientsData = Object.values(
    data.reduce((acc, rental) => {
      const key = rental.phone; // Use phone as unique identifier
      if (!acc[key]) {
        acc[key] = {
          name: rental.name,
          phone: rental.phone,
          totalRentals: 0,
          totalSpent: 0,
          activeRentals: 0,
          lastRental: rental.rentDate,
        };
      }
      acc[key].totalRentals += 1;
      acc[key].totalSpent += rental.totalAmount;
      if (!rental.returnDate) {
        acc[key].activeRentals += 1;
      }
      // Update last rental date if more recent
      if (new Date(rental.rentDate) > new Date(acc[key].lastRental)) {
        acc[key].lastRental = rental.rentDate;
      }
      return acc;
    }, {} as Record<string, { name: string; phone: string; totalRentals: number; totalSpent: number; activeRentals: number; lastRental: string; }>)
  );

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar glass-panel">
        <div className="logo-section">
          <div className="logo-icon btn-primary">
            <Database size={20} />
          </div>
          <span className="logo-text">RentFlow</span>
        </div>
        
        <nav className="sidebar-nav">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <NavItem active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon={<FileSpreadsheet size={20} />} label="Rentals" />
          <NavItem active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} icon={<Users size={20} />} label="Clients" />
          <NavItem active={false} onClick={() => {}} icon={<BarChart3 size={20} />} label="Analytics" />
          <NavItem active={false} onClick={() => {}} icon={<Settings size={20} />} label="Settings" />
        </nav>

        <div className="storage-info">
          <div className="storage-header">
            <span>Storage Usage</span>
            <span>45%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '45%' }}></div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="content-header">
          <div className="header-left">
            <h1 className="title-gradient">Welcome back, Balaji</h1>
            <p>Managing {totalRentals} rental entries across 3 devices.</p>
          </div>
          <div className="header-right">
            <div className="search-bar glass-panel">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search rentals..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <PlusCircle size={18} />
              Add Rental
            </button>
          </div>
        </header>

        {/* Connection Error Banner */}
        {connectionError && (
          <div className="error-banner">
            <span>⚠️ Unable to connect to server. Showing sample data.</span>
            <button onClick={() => fetchData()} className="retry-btn">Retry</button>
          </div>
        )}

        {/* Clients View */}
        {activeTab === 'clients' ? (
          <>
            {/* Clients Stats */}
            <section className="stats-grid">
              <StatCard title="Total Clients" value={clientsData.length.toString()} icon={<Users size={24} color="#10b981" />} trend={`${clientsData.length} unique`} />
              <StatCard title="Active Clients" value={clientsData.filter(c => c.activeRentals > 0).length.toString()} icon={<TrendingUp size={24} color="#6366f1" />} trend="Currently renting" />
              <StatCard title="Avg Spend" value={`₹ ${clientsData.length > 0 ? (clientsData.reduce((acc, c) => acc + c.totalSpent, 0) / clientsData.length).toFixed(0) : 0}`} icon={<BarChart3 size={24} color="#8b5cf6" />} trend="Per client" />
            </section>

            {/* Clients Table */}
            <div className="content-body glass-panel">
              <div className="table-header">
                <div>
                  <h2>Client Directory</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Complete list of all clients and their rental history.
                  </p>
                </div>
              </div>

              <div className="table-container">
                {clientsData.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Client Name</th>
                        <th>Phone</th>
                        <th>Total Rentals</th>
                        <th>Active Rentals</th>
                        <th>Total Spent</th>
                        <th>Last Rental</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientsData.map((client, idx) => (
                        <motion.tr
                          key={client.phone}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: idx * 0.03 }}
                        >
                          <td>
                            <div className="client-info">
                              <span className="client-name">{client.name}</span>
                            </div>
                          </td>
                          <td>{client.phone}</td>
                          <td>
                            <span className="badge-id">{client.totalRentals}</span>
                          </td>
                          <td>
                            <span className={`status-badge ${client.activeRentals > 0 ? 'active' : 'returned'}`}>
                              {client.activeRentals}
                            </span>
                          </td>
                          <td>
                            <span className="amount-col">₹{client.totalSpent.toLocaleString()}</span>
                          </td>
                          <td>{client.lastRental}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">
                    <Users size={48} color="rgba(255,255,255,0.1)" />
                    <p>No clients found. Add rentals to see clients.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Dashboard Stats */}
            <section className="stats-grid">
              <StatCard title="Total Revenue" value={`₹ ${totalRevenue.toLocaleString()}`} icon={<TrendingUp size={24} color="#10b981" />} trend="+12.5%" />
              <StatCard title="Active Rentals" value={totalRentals.toString()} icon={<FileSpreadsheet size={24} color="#6366f1" />} trend="+5 since last week" />
              <StatCard title="Avg Daily Rate" value={`₹ ${avgDailyRate.toFixed(0)}`} icon={<BarChart3 size={24} color="#8b5cf6" />} trend="Stable" />
            </section>

            {/* Main Section */}
        <div className="content-body glass-panel">
          <div className="table-header">
            <div>
              <h2>Rental Inventory</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Overview of all equipment rentals and their current status.
              </p>
            </div>
            <div className="table-actions">
              <button className="btn btn-secondary">
                <Filter size={18} />
                Filters
              </button>
            </div>
          </div>

          <div className="table-container">
            {filteredData.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>SL NO</th>
                    <th>Client Name</th>
                    <th>Product Details</th>
                    <th>Rent Date</th>
                    <th>Rate</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {filteredData.map((item, idx) => (
                      <motion.tr 
                        key={item._id || item.slNo + idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: idx * 0.03 }}
                      >
                        <td><span className="badge-id">#{item.slNo}</span></td>
                        <td>
                          <div className="client-info">
                            <span className="client-name">{item.name}</span>
                            <span className="client-phone">{item.phone}</span>
                          </div>
                        </td>
                        <td>
                          <div className="product-info">
                            <span className="product-name">{item.product}</span>
                          </div>
                        </td>
                        <td>{item.rentDate}</td>
                        <td>₹{item.perDayRent}</td>
                        <td>
                          <span className="amount-col">₹{item.totalAmount}</span>
                        </td>
                        <td>
                          <span className={`status-badge ${item.returnDate ? 'returned' : 'active'}`}>
                            {item.returnDate ? 'Returned' : 'Active'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-icon btn-delete"
                            onClick={() => handleDeleteRental(item._id, item.slNo)}
                            title="Delete rental"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <FileSpreadsheet size={48} color="rgba(255,255,255,0.1)" />
                <p>No rentals found. Click "Add Rental" to get started.</p>
              </div>
            )}
          </div>
        </div>
          </>
        )}
      </main>

      {/* Add Rental Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              className="modal-content glass-panel"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Add New Rental</h2>
                <button className="btn-icon" onClick={() => setShowAddModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddRental} className="rental-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Serial No.</label>
                    <input
                      type="text"
                      name="slNo"
                      value={formData.slNo}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Customer Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Product</label>
                    <input
                      type="text"
                      name="product"
                      value={formData.product}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Per Day Rent (₹)</label>
                    <input
                      type="number"
                      name="perDayRent"
                      value={formData.perDayRent}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Rent Date</label>
                    <input
                      type="date"
                      name="rentDate"
                      value={formData.rentDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Time Out</label>
                    <input
                      type="time"
                      name="timeOut"
                      value={formData.timeOut}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Return Date</label>
                    <input
                      type="date"
                      name="returnDate"
                      value={formData.returnDate}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Advance Amount (₹)</label>
                    <input
                      type="number"
                      name="advanceAmt"
                      value={formData.advanceAmt}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Total Amount (₹)</label>
                    <input
                      type="number"
                      name="totalAmount"
                      value={formData.totalAmount}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Add Rental
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .error-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 0.75rem;
          color: #fca5a5;
          font-size: 0.9rem;
        }
        .retry-btn {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #fca5a5;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.2s;
        }
        .retry-btn:hover {
          background: rgba(239, 68, 68, 0.3);
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2rem;
        }
        .modal-content {
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 2rem;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .modal-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
        }
        .rental-form {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-group label {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .form-group input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          padding: 0.75rem;
          color: white;
          font-family: inherit;
          font-size: 0.95rem;
          transition: all 0.2s;
        }
        .form-group input:focus {
          outline: none;
          border-color: var(--accent-primary);
          background: rgba(255, 255, 255, 0.08);
        }
        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }
        .disabled { opacity: 0.5; cursor: not-allowed; }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
          gap: 1rem;
          color: var(--text-secondary);
        }
        .app-container {
          display: flex;
          width: 100%;
          min-height: 100vh;
          background: var(--bg-primary);
          padding: 1.5rem;
          gap: 1.5rem;
        }

        .sidebar {
          width: 280px;
          display: flex;
          flex-direction: column;
          padding: 2rem;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 3rem;
        }

        .logo-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
        }

        .logo-text {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-radius: 0.75rem;
          color: var(--text-secondary);
          text-decoration: none;
          transition: all 0.2s;
          cursor: pointer;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
        }

        .nav-item.active {
          background: rgba(99, 102, 241, 0.1);
          color: var(--accent-primary);
          font-weight: 600;
        }

        .storage-info {
          margin-top: 2rem;
          background: rgba(0, 0, 0, 0.2);
          padding: 1rem;
          border-radius: 1rem;
        }

        .storage-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
          color: var(--text-secondary);
        }

        .progress-bar {
          height: 6px;
          background: #333;
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(to right, var(--accent-primary), var(--accent-secondary));
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-left h1 {
          font-size: 2rem;
          margin-bottom: 0.25rem;
        }

        .header-left p {
          color: var(--text-secondary);
        }

        .header-right {
          display: flex;
          gap: 1rem;
        }

        .search-bar {
          display: flex;
          align-items: center;
          padding: 0 1rem;
          min-width: 300px;
        }

        .search-icon {
          color: var(--text-secondary);
        }

        .search-bar input {
          background: transparent;
          border: none;
          color: white;
          padding: 0.75rem;
          outline: none;
          width: 100%;
          font-family: inherit;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        .stat-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-details h3 {
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-bottom: 0.25rem;
        }

        .stat-details .value {
          font-size: 1.75rem;
          font-weight: 700;
        }

        .stat-trend {
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .content-body {
          flex: 1;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          min-height: 400px;
        }

        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .table-actions {
          display: flex;
          gap: 0.75rem;
        }

        .table-container {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          text-align: left;
          padding: 1rem;
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-weight: 600;
          border-bottom: 1px solid var(--border);
        }

        td {
          padding: 1.25rem 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          transition: background 0.2s;
        }

        tr:hover td {
          background: rgba(255, 255, 255, 0.02);
        }

        .badge-id {
          background: rgba(255, 255, 255, 0.1);
          padding: 0.25rem 0.5rem;
          border-radius: 0.5rem;
          font-size: 0.8rem;
          font-family: monospace;
        }

        .client-info {
          display: flex;
          flex-direction: column;
        }

        .client-name {
          font-weight: 600;
          color: #fff;
        }

        .client-phone {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .product-name {
          font-size: 0.95rem;
          color: #e2e8f0;
        }

        .amount-col {
          font-weight: 700;
          color: #fff;
        }

        .status-badge {
          font-size: 0.75rem;
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-weight: 600;
        }

        .status-badge.active {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .status-badge.returned {
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
        }

        .btn-icon {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 50%;
          display: flex;
          transition: all 0.2s;
        }

        .btn-icon:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .btn-delete:hover {
          background: rgba(239, 68, 68, 0.1) !important;
          color: #ef4444 !important;
        }
      `}</style>
    </div>
  )
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <div className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </div>
  )
}

function StatCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) {
  return (
    <div className="stat-card glass-panel fade-in">
      <div className="stat-icon">{icon}</div>
      <div className="stat-details">
        <h3>{title}</h3>
        <div className="value">{value}</div>
      </div>
      <div className="stat-trend">
        <ArrowUpRight size={14} color="#10b981" />
        <span style={{ color: '#10b981' }}>{trend}</span>
      </div>
    </div>
  )
}
