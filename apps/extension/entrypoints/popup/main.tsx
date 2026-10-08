import { createRoot } from 'react-dom/client';
import '@/assets/tailwind.css';
import { initTheme } from '@/src/ui/theme';
import { App } from '@/src/ui/popup/App';

initTheme();
createRoot(document.getElementById('root')!).render(<App />);
