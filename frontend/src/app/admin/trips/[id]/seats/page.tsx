'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function AdminTripSeatsRedirect() {
  const params = useParams();
  const router = useRouter();
  const tripId = (params?.id as string) || 'trip-sg-dl-2200';

  useEffect(() => {
    router.replace(`/admin/seats?tripId=${tripId}`);
  }, [tripId, router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-4 border-[#2E7D32] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-bold">
          Đang tải sơ đồ ghế chuyến {tripId}...
        </p>
      </div>
    </div>
  );
}
