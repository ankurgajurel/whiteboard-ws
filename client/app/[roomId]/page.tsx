import { Whiteboard } from '@/app/components/whiteboard/whiteboard';

interface PageProps {
  params: {
    roomId: string;
  };
  searchParams: {
    host?: string;
  };
}

export default function WhiteboardPage({ params, searchParams }: PageProps) {
  const isHost = searchParams.host === 'true';

  return (
    <main className="min-h-screen">
      <Whiteboard roomId={params.roomId} isHost={isHost} />
    </main>
  );
} 