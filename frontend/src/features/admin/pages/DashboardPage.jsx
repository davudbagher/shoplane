import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "../components/AdminLayout";
import { shopsApi } from "../../../shared/api";
import { Button } from "../../../shared/components/Button";

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      const data = await shopsApi.getMyShops();
      setShops(data);
    } catch (err) {
      console.error("Failed to load shops:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="loading-spinner h-12 w-12 mx-auto mb-4"></div>
          <p className="text-gray-600">Yüklənir...</p>
        </div>
      </AdminLayout>
    );
  }

  // No shops - Show welcome screen
  if (shops.length === 0) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="mb-8">
            <span className="text-6xl">🏪</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            1link.az-a Xoş Gəldiniz!
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            İlk onlayn mağazanızı yaradın və Azərbaycanda məhsullarınızı satmağa
            başlayın!
          </p>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
            <div className="card p-6">
              <div className="text-3xl mb-3">🌐</div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Öz Subdomeniniz
              </h3>
              <p className="text-sm text-gray-600">
                magaza.1link.az kimi özəl linkdən istifadə edin
              </p>
            </div>

            <div className="card p-6">
              <div className="text-3xl mb-3">💳</div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Lokal Ödənişlər
              </h3>
              <p className="text-sm text-gray-600">
                MilliKart, BirBank, Nağd ödəniş
              </p>
            </div>

            <div className="card p-6">
              <div className="text-3xl mb-3">📱</div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Mobil Optimallaşdırılıb
              </h3>
              <p className="text-sm text-gray-600">
                Telefondan rahat alış-veriş təcrübəsi
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            variant="primary"
            onClick={() => navigate("/admin/shops/new")}
            className="px-8 py-3 text-lg"
          >
            İlk Mağazanı Yarat 🚀
          </Button>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="card p-4">
              <div className="text-2xl font-bold text-primary-600">0</div>
              <div className="text-sm text-gray-600">Mağazalar</div>
            </div>
            <div className="card p-4">
              <div className="text-2xl font-bold text-primary-600">0</div>
              <div className="text-sm text-gray-600">Məhsullar</div>
            </div>
            <div className="card p-4">
              <div className="text-2xl font-bold text-primary-600">0</div>
              <div className="text-sm text-gray-600">Sifarişlər</div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Has shops - Show dashboard
  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">İdarəetmə Paneli</h1>
          <Button
            variant="primary"
            onClick={() => navigate("/admin/shops/new")}
          >
            + Yeni Mağaza
          </Button>
        </div>

        {/* Shops List */}
        {/* Shops List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => {
            console.log("Shop object:", shop); // Debug log
            console.log("Shop ID:", shop.id); // Debug log

            return (
              <div
                key={shop.id}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="card-body">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {shop.name}
                  </h3>
                  <p className="text-sm text-primary-600 mb-4">
                    {shop.subdomain}.1link.az
                  </p>
                  <div className="flex justify-between text-sm text-gray-600 mb-4">
                    <span>Məhsullar: 0</span>
                    <span>Sifarişlər: 0</span>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      console.log("Navigating to shop ID:", shop.id); // Debug log
                      navigate(`/admin/shops/${shop.id}`);
                    }}
                    className="w-full"
                  >
                    İdarə Et
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
};
