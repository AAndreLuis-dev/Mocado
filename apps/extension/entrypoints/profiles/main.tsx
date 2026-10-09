import '@/assets/tailwind.css';
import { boot } from '@/src/ui/boot';
import { ManageApp } from '@/src/ui/manage/App';

void boot(<ManageApp initial="history" />);
