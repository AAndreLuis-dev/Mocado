import { createRoot } from 'react-dom/client';
import '@/assets/tailwind.css';
import { ManageApp } from '@/src/ui/manage/App';
import { initTheme } from '@/src/ui/theme';

initTheme();
createRoot(document.getElementById('root')!).render(<ManageApp initial="history" />);
