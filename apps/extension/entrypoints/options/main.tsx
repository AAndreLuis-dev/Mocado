import { createRoot } from 'react-dom/client';
import '@/assets/tailwind.css';
import { ManageApp } from '@/src/manage/App';
import { initTheme } from '@/src/theme';

initTheme();
createRoot(document.getElementById('root')!).render(<ManageApp initial="options" />);
