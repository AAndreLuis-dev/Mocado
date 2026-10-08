import { History, Settings2, WandSparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { t } from '../../infra/browser/i18n';
import { sendToBackground } from '../../infra/browser/messages';
import { activeTabId, openHistory, openOptions, shortcuts } from '../../infra/browser/navigation';
import { Button, Kbd, Switch } from '../components/controls';
import { Logo } from '../components/ficha';
import { Generator } from './Generator';
import { Recent } from './Recent';
import { load, save } from './local';

export function App() {
  const [masked, setMasked] = useState(() => load('mocado.masked', '1') === '1');
  const [status, setStatus] = useState('');
  const [fillKeys, setFillKeys] = useState('');

  useEffect(() => {
    void shortcuts().then((cmds) =>
      setFillKeys(cmds.find((c) => c.name === 'fill-form')?.shortcut ?? ''),
    );
  }, []);

  async function fillPage(reuseId?: string) {
    const tabId = await activeTabId();
    if (tabId === undefined) return;
    const res = await sendToBackground({ type: 'fill-tab', tabId, reuseId }).catch(() => null);
    if (!res || !res.ok)
      return setStatus(t(res?.error === 'blocked' ? 'popup.blocked' : 'popup.fillError'));
    if (res.filled === 0) return setStatus(t('popup.noFields'));
    window.close();
  }

  return (
    <main className="flex w-[380px] flex-col bg-papel font-sans text-tinta">
      <header className="flex items-center gap-2 px-4 pt-3.5">
        <Logo size={22} />
        <h1 className="text-[17px] font-bold tracking-tight">{t('extName')}</h1>
        <Switch
          className="ml-auto items-center text-[13px] text-grafite"
          label={t('popup.masked')}
          checked={masked}
          onChange={(e) => {
            setMasked(e.target.checked);
            save('mocado.masked', e.target.checked ? '1' : '0');
          }}
        />
      </header>

      <div className="px-4 pt-3">
        <Button
          variant="primary"
          className="h-11 w-full rounded-lg text-[15px]"
          icon={<WandSparkles size={17} />}
          onClick={() => void fillPage()}
        >
          {t('popup.fillPage')}
          {fillKeys && <Kbd keys={fillKeys} className="ml-auto opacity-80" />}
        </Button>
        {status && (
          <p role="alert" className="mt-2 rounded-md bg-erro-claro px-3 py-2 text-[13px] text-erro">
            {status}
          </p>
        )}
      </div>

      <Generator masked={masked} />

      <Recent onReuse={(id) => void fillPage(id)} />

      <footer className="mt-1 flex flex-col gap-2 border-t border-linha px-4 pt-2 pb-3">
        <nav className="-mx-2 flex gap-1">
          <Button variant="ghost" icon={<History size={15} />} onClick={() => void openHistory()}>
            {t('popup.history')}
          </Button>
          <Button variant="ghost" icon={<Settings2 size={15} />} onClick={() => void openOptions()}>
            {t('popup.options')}
          </Button>
        </nav>
        <p className="text-[11px] leading-snug text-grafite">{t('disclaimer')}</p>
      </footer>
    </main>
  );
}
