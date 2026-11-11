import { estadoVivo } from '@/lib/estado';
import { INFO } from '@/lib/info';
import MissionControl from '@/components/MissionControl';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mission Control' };

export default async function Pagina() {
  return (
    <>
      <details className="info" style={{ marginBottom: 10 }}><summary>Qué es Mission Control</summary><p><b>{INFO[''][0]}</b> {INFO[''][1]}</p></details>
      <MissionControl inicial={await estadoVivo()} />
    </>
  );
}
