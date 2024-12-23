const Alert = ({ children, className = "" }) => {
  return (
    <div
      role="alert"
      className={`relative w-full rounded-lg border p-4 ${className}`}
    >
      {children}
    </div>
  );
};

const AlertTitle = ({ children, className = "" }) => {
  return (
    <h5 className={`mb-1 font-medium leading-none tracking-tight ${className}`}>
      {children}
    </h5>
  );
};

export { Alert, AlertTitle }; 