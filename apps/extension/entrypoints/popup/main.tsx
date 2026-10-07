import { createRoot } from 'react-dom/client';
import '@/assets/tailwind.css';
import { i18n } from '#i18n';

function App() {
  return <h1 className="p-4 text-lg font-semibold">{i18n.t('extName')}</h1>;
}

createRoot(document.getElementById('root')!).render(<App />);
