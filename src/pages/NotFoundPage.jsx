import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return <main className="not-found">
    <p className="eyebrow">SMART LIFE</p>
    <strong>404</strong><h1>Page not found</h1>
    <p>The page you are looking for does not exist.</p>
    <Link className="primary-button" to="/planner">Back to planner</Link></main>;
}
