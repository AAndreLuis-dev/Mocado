import { createRoot } from 'react-dom/client';
import '@/assets/tailwind.css';
import { ManageApp } from '@/src/manage/App';

createRoot(document.getElementById('root')!).render(<ManageApp initial="history" />);
