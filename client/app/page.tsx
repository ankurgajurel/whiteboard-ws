'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { v4 as uuidv4 } from 'uuid';

export default function HomePage() {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');

  const createRoom = () => {
    const newRoomId = uuidv4().slice(0, 8);
    router.push(`/${newRoomId}?host=true`);
  };

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      router.push(`/${roomId}`);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Whiteboard</h1>
          <p className="text-gray-600">Create or join a whiteboard room</p>
        </div>

        <div className="space-y-6">
          <div>
            <Button
              onClick={createRoom}
              className="w-full py-6 text-lg"
            >
              Create New Room
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or join existing</span>
            </div>
          </div>

          <form onSubmit={joinRoom} className="space-y-4">
            <div>
              <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-2">
                Room ID
              </label>
              <input
                type="text"
                id="roomId"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter room ID"
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              className="w-full py-6 text-lg"
              disabled={!roomId.trim()}
            >
              Join Room
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
