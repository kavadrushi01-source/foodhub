import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';

export default function NotFound() {
  return (
    <div className="container-app flex items-center justify-center min-h-[60vh]">
      <EmptyState
        icon={null}
        title="404 - Page not found"
        description="The page you're looking for doesn't exist or has been moved."
        action={
          <Link to="/" className="btn-primary"><Home size={18} /> Back to Home</Link>
        }
      />
    </div>
  );
}
