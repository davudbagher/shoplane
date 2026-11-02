import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../../shared/api';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';

export const SetupPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.password.length < 8) {
      newErrors.password = 'Şifrə minimum 8 simvol olmalıdır';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifrələr eyni deyil';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setSubmitError(null);

    try {
      await authApi.setupPassword(token, formData.password);
      navigate('/login', { replace: true });
    } catch (err) {
      setSubmitError(err.response?.data?.detail || 'Şifrə təyin edilmədi. Yenidən cəhd edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-700 mb-2">
            1line.az
          </h1>
          <p className="text-gray-600">
            Mağazanız hazırdır
          </p>
        </div>

        <div className="card">
          <div className="card-body p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
              Şifrənizi Təyin Edin
            </h2>

            {!token ? (
              <p className="text-danger-700 text-sm text-center">
                Bu link etibarsızdır. WhatsApp-da aldığınız linkdən istifadə edin.
              </p>
            ) : (
              <>
                {submitError && (
                  <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg">
                    <p className="text-danger-700 text-sm">{submitError}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <Input
                    label="Yeni Şifrə"
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    required
                  />

                  <Input
                    label="Şifrəni Təkrarlayın"
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    required
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    className="w-full"
                  >
                    {loading ? 'Yadda saxlanılır...' : 'Şifrəni Təyin Et'}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
