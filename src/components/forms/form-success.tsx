interface FormSuccessProps {
  message?: string;
}

export function FormSuccess({ message }: FormSuccessProps) {
  if (!message) return null;
  return (
    <p role="status" className="text-xs font-medium text-success">
      {message}
    </p>
  );
}
