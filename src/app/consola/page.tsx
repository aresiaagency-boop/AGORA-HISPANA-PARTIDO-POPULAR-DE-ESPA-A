import { estadoVivo } from '@/lib/estado';
import MissionControl from '@/components/MissionControl';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mission Control' };

export default async function Pagina() {
  return <MissionControl inicial={await estadoVivo()} />;
}
