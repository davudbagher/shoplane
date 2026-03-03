function App() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">
            🇦🇿 1link.az
          </h1>
          <p className="text-gray-600">
            Multi-tenant E-commerce Platform for Azerbaijan
          </p>
        </div>

        {/* Test Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <div className="card-body">
              <h3 className="text-xl font-semibold mb-2">✅ Backend Complete</h3>
              <p className="text-gray-600 mb-4">32 API endpoints ready</p>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• JWT Authentication</li>
                <li>• Multi-tenant Architecture</li>
                <li>• PostgreSQL Database</li>
                <li>• FastAPI + SQLAlchemy</li>
              </ul>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 className="text-xl font-semibold mb-2">🎨 Frontend Started</h3>
              <p className="text-gray-600 mb-4">React + Vite + Tailwind</p>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Mobile-first Design</li>
                <li>• Azerbaijan Brand Colors</li>
                <li>• Touch-optimized UI</li>
                <li>• Responsive Components</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="card mb-8">
          <div className="card-body">
            <h3 className="text-lg font-semibold mb-4">Test Buttons</h3>
            <div className="flex flex-wrap gap-3">
              <button className="btn-primary">Primary Button</button>
              <button className="btn-secondary">Secondary Button</button>
              <button className="btn-success">Success Button</button>
              <button className="btn-danger">Danger Button</button>
            </div>
          </div>
        </div>

        {/* Test Product Grid */}
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold mb-4">Product Grid (Mobile-first)</h3>
            <div className="product-grid">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="product-card">
                  <div className="product-image bg-gradient-to-br from-primary-200 to-primary-400" />
                  <div className="card-body">
                    <h4 className="font-medium text-sm mb-1">Product {i}</h4>
                    <p className="product-price price-azn">49.99</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="card mt-6">
          <div className="card-body">
            <h3 className="text-lg font-semibold mb-4">Order Status Badges</h3>
            <div className="flex flex-wrap gap-2">
              <span className="badge-pending">Pending</span>
              <span className="badge-confirmed">Confirmed</span>
              <span className="badge-shipped">Shipped</span>
              <span className="badge-delivered">Delivered</span>
              <span className="badge-cancelled">Cancelled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App