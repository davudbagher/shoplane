import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from '../../../shared/components';
import { adminApi } from "../../../shared/api";
import { Button } from "../../../shared/components/Button";

export const ProductVariantsPage = () => {
  const { shopId, productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- Option Creator State (Shopify-style) ---
  const [options, setOptions] = useState([
    { name: "Rəng", values: "" }, // e.g., "Qırmızı, Qara"
    { name: "Ölçü", values: "" }   // e.g., "S, M, L"
  ]);

  const [variantsList, setVariantsList] = useState([]);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getProduct(shopId, productId);
      setProduct(data);
      setVariantsList(Array.isArray(data.variants) ? data.variants : []);
    } catch (err) {
      console.error("Failed to load product variants:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (index, field, value) => {
    const updated = [...options];
    updated[index][field] = value;
    setOptions(updated);
  };

  const addOptionField = () => {
    if (options.length >= 3) return; // limit to 3 options for simplicity
    setOptions([...options, { name: "", values: "" }]);
  };

  const removeOptionField = (index) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  // 🧮 Matrix / Combinations Generator
  const generateCombinations = () => {
    // 1. Clean and parse values
    const cleanedOptions = options
      .filter(o => o.name.trim() && o.values.trim())
      .map(o => ({
        name: o.name.trim(),
        values: o.values.split(',').map(v => v.trim()).filter(Boolean)
      }))
      .filter(o => o.values.length > 0);

    if (cleanedOptions.length === 0) {
      alert("Lütfən ən azı bir Variant Atributu və Qiymətləri doldurun (məs: Rəng - Qırmızı, Qara)");
      return;
    }

    // 2. Cartesian Product algorithm
    const cartesian = (arrays) => {
      return arrays.reduce((acc, curr) => {
        return acc.flatMap(d => curr.map(e => [...d, e]));
      }, [[]]);
    };

    const valuesArrays = cleanedOptions.map(o => o.values);
    const combos = cartesian(valuesArrays);

    // 3. Map to Variant Objects
    const newVariants = combos.map(combo => {
      const variantObj = { inventory_count: 0, sold_count: 0 };
      cleanedOptions.forEach((option, index) => {
        // Map back to properties dynamically or just store on string keys
        if (option.name.toLowerCase() === 'rəng' || option.name.toLowerCase() === 'color') variantObj.color = combo[index];
        else if (option.name.toLowerCase() === 'ölçü' || option.name.toLowerCase() === 'size') variantObj.size = combo[index];
        else variantObj[option.name] = combo[index]; // Fallback dynamic property
      });
      return variantObj;
    });

    // 4. Merge or Overwrite? Users usually append or overwrite. Let's ask or Just Overwrite with Confirm.
    if (variantsList.length > 0 && !window.confirm("Mövcud siyahı silinəcək və yalnız yenilər yaradılacaq. Əminsiniz?")) {
      return;
    }

    setVariantsList(newVariants);
  };

  const handleVariantInputChange = (index, field, value) => {
    const updated = [...variantsList];
    updated[index][field] = value;
    setVariantsList(updated);
  };

  const removeVariant = (index) => {
    setVariantsList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveVariants = async () => {
    setSaving(true);
    try {
      await adminApi.updateProduct(shopId, productId, { variants: variantsList });
      alert("Variant Matrixi uğurla yadda saxlanıldı!");
    } catch (err) {
      alert("Xəta baş verdi. Yenidən cəhd edin.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64"><div className="loading-spinner h-10 w-10 mx-auto" /></div>
      </AdminLayout>
    );
  }

  if (!product) return <AdminLayout><div className="text-center py-12">Product not found.</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(`/admin/shops/${shopId}`)} className="text-gray-500 hover:text-gray-900 text-sm font-semibold flex items-center gap-1">
            ← Geri qayıt
          </button>
          <Button variant="primary" onClick={handleSaveVariants} loading={saving}>
            Yadda Saxla
          </Button>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center gap-4">
          {product.images?.[0] ? <img src={product.images[0]} alt={product.name} className="w-14 h-14 rounded-xl object-cover border" /> : <div className="w-14 h-14 bg-gray-50 flex items-center justify-center text-xl border rounded-xl">📦</div>}
          <div>
            <h1 className="text-base font-black text-gray-900">{product.name}</h1>
            <p className="text-xs text-gray-400">Ümumi Stok: {product.inventory_count} ədəd</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* ── 1. Options Matrix Generator Generator ── */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b pb-2">Variant Atributları (Matrix)</h3>
            
            <div className="space-y-3">
              {options.map((option, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg relative border border-gray-100 space-y-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-400 mb-0.5">Atribut Adi (Məs: Rəng)</label>
                    <input
                      type="text"
                      value={option.name}
                      placeholder="Məs: Rəng"
                      onChange={(e) => handleOptionChange(idx, 'name', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-400 mb-0.5">Qiymətlər (Vergüllə ayırın)</label>
                    <input
                      type="text"
                      value={option.values}
                      placeholder="Qırmızı, Qara, Mavi"
                      onChange={(e) => handleOptionChange(idx, 'values', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-gray-500"
                    />
                  </div>
                  {options.length > 1 && (
                    <button onClick={() => removeOptionField(idx)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 text-xs">✕</button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 3 && (
              <button onClick={addOptionField} className="w-full py-1.5 border border-dashed border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50 font-medium">
                + Atribut Əlavə Et
              </button>
            )}

            <button
              onClick={generateCombinations}
              className="w-full py-2.5 bg-gray-950 hover:bg-gray-800 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition shadow-sm mt-2"
            >
              Kombinasiyaları Generator et
            </button>
            <p className="text-[10px] text-gray-400 text-center">Atributları daxil edib generator etdikdə Shopify üslublu bulk cədvəl yaranır.</p>
          </div>

          {/* ── 2. Matrix Table Outputs (2/3 Width) ── */}
          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 p-5 border-b border-gray-50">Bulk Kombinasiyalar Siyahısı ({variantsList.length})</h3>

            {variantsList.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-3xl mb-2">📊</p>
                <p className="text-xs">Variantlar tapılmadı. Generator edin və ya əllə daxil edin.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase tracking-wider font-bold">
                      <th className="px-5 py-3">Rəng</th>
                      <th className="px-5 py-3">Ölçü</th>
                      <th className="px-5 py-3">Stok Miqdarı</th>
                      <th className="px-5 py-3">Satılıb</th>
                      <th className="px-5 py-3 text-right">Sil</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs">
                    {variantsList.map((v, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-5 py-2.5 font-bold text-gray-900">{v.color || "—"}</td>
                        <td className="px-5 py-2.5"><span className="bg-gray-100 px-1.5 py-0.5 rounded font-bold text-gray-600">{v.size || "—"}</span></td>
                        <td className="px-5 py-2.5">
                          <input
                            type="number"
                            min="0"
                            value={v.inventory_count || 0}
                            onChange={(e) => handleVariantInputChange(i, 'inventory_count', parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:border-gray-500 font-mono"
                          />
                        </td>
                        <td className="px-5 py-2.5">
                          <input
                            type="number"
                            min="0"
                            value={v.sold_count || 0}
                            onChange={(e) => handleVariantInputChange(i, 'sold_count', parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:border-gray-500 font-mono text-green-600 font-bold"
                          />
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <button onClick={() => removeVariant(i)} className="text-gray-300 hover:text-red-500 transition">✕</button>
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
    </AdminLayout>
  );
};
