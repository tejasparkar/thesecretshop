import { Link } from 'react-router-dom';
import Lines from '../components/Lines.jsx';

export default function NotFound() {
  return (
    <div className="wrap page-msg">
      <Lines as="h1" className="huge" lines={['404']} />
      <p>This page is so secret even we can't find it.</p>
      <Link to="/" className="pill">Back home</Link>
    </div>
  );
}
