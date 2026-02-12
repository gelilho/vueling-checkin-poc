"use client";

interface BoardingPassProps {
  passengerName: string;
  flight: string;
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  date: string;
  departure: string;
  arrival?: string;
  seat: string;
  gate: string;
  terminal: string;
}

export default function BoardingPass({
  passengerName,
  flight,
  origin,
  originCity,
  destination,
  destinationCity,
  date,
  departure,
  arrival,
  seat,
  gate,
  terminal,
}: BoardingPassProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Top band */}
      <div className="bg-vueling-yellow px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-vueling-dark rounded flex items-center justify-center">
            <span className="text-vueling-yellow font-bold text-[10px]">V</span>
          </div>
          <span className="font-semibold text-vueling-dark text-sm">vueling</span>
        </div>
        <span className="text-vueling-dark/70 font-mono text-xs font-medium">{flight}</span>
      </div>

      {/* Route */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-2xl font-bold text-vueling-dark">{origin}</p>
            <p className="text-[10px] text-vueling-gray mt-0.5">{originCity}</p>
          </div>

          <div className="flex-1 flex items-center justify-center px-4">
            <div className="flex items-center gap-1 w-full">
              <div className="w-2 h-2 rounded-full bg-vueling-dark" />
              <div className="flex-1 border-t border-dashed border-gray-300" />
              <svg className="w-4 h-4 text-vueling-dark -mx-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0011.5 2 1.5 1.5 0 0010 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
              <div className="flex-1 border-t border-dashed border-gray-300" />
              <div className="w-2 h-2 rounded-full bg-vueling-yellow" />
            </div>
          </div>

          <div className="text-center">
            <p className="text-2xl font-bold text-vueling-dark">{destination}</p>
            <p className="text-[10px] text-vueling-gray mt-0.5">{destinationCity}</p>
          </div>
        </div>
      </div>

      {/* Divider with tear effect */}
      <div className="relative px-5">
        <div className="border-t border-dashed border-gray-200" />
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 rounded-full" />
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 rounded-full" />
      </div>

      {/* Details grid */}
      <div className="px-5 py-4 grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] text-vueling-gray uppercase tracking-wider">Passenger</p>
          <p className="text-xs font-semibold text-vueling-dark mt-0.5 truncate">{passengerName}</p>
        </div>
        <div>
          <p className="text-[10px] text-vueling-gray uppercase tracking-wider">Date</p>
          <p className="text-xs font-semibold text-vueling-dark mt-0.5">{date}</p>
        </div>
        <div>
          <p className="text-[10px] text-vueling-gray uppercase tracking-wider">Departure</p>
          <p className="text-xs font-semibold text-vueling-dark mt-0.5">{departure}</p>
        </div>
        <div>
          <p className="text-[10px] text-vueling-gray uppercase tracking-wider">Seat</p>
          <p className="text-lg font-bold text-vueling-dark">{seat}</p>
        </div>
        <div>
          <p className="text-[10px] text-vueling-gray uppercase tracking-wider">Gate</p>
          <p className="text-lg font-bold text-vueling-dark">{gate}</p>
        </div>
        <div>
          <p className="text-[10px] text-vueling-gray uppercase tracking-wider">Terminal</p>
          <p className="text-lg font-bold text-vueling-dark">{terminal}</p>
        </div>
      </div>

      {/* QR Code area */}
      <div className="px-5 pb-5 flex justify-center">
        <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
          {/* Mock QR code pattern */}
          <div className="grid grid-cols-7 gap-[2px]">
            {Array.from({ length: 49 }).map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-[1px] ${
                  Math.random() > 0.4 ? "bg-vueling-dark" : "bg-transparent"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
