import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "../../../shared/components";
import { useShopStore } from "../../../shared/store/shopStore";
import { Button } from "../../../shared/components/Button";

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { shops, activeShopId, fetchShops, isLoading } = useShopStore();

  useEffect(() => {
    // We only trigger fetch if it's completely empty and not loading
    if (shops.length === 0 && !isLoading) {
      fetchShops();
    }
  }, []);

  // Whenever the active shop is established, seamlessly redirect to its management panel
  useEffect(() => {
    if (activeShopId) {
      navigate(`/admin/shops/${activeShopId}`, { replace: true });
    }
  }, [activeShopId, navigate]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="loading-spinner h-12 w-12 mx-auto mb-4"></div>
          <p className="text-gray-600">Yüklənir...</p>
        </div>
      </AdminLayout>
    );
  }

  // If entirely no shops exist, display the welcome flow
  if (shops.length === 0 && !isLoading) {
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

          <Button
            variant="primary"
            onClick={() => navigate("/admin/shops/new")}
            className="px-8 py-3 text-lg"
          >
            İlk Mağazanı Yarat 🚀
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="text-center py-12">
          <div className="loading-spinner h-12 w-12 mx-auto mb-4"></div>
          <p className="text-gray-600">Mağazaya yönləndirilir...</p>
      </div>
    </AdminLayout>
  );
};
