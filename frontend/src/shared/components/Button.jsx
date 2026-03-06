export const Button = ({ 
  children, 
  variant = 'primary', 
  type = 'button',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  ...props 
}) => {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    danger: 'btn-danger',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <span className="loading-spinner mr-2 h-5 w-5" />
          Gözləyin...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
