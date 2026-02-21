import CollageGrid from "../ui/CollageGrid";
import destinations from '@/mocks/mock_destinations_informative.json';
export default function Destinations() {
  return (
    <div className="flex-col space-y-6">
      <div className="flex-col text-center">
        <p className="text-lg text-accent font-medium">INSPIRACIÓN</p>
        <p className="text-4xl font-medium">Destinos Trending</p>
      </div>
      <div>
        <CollageGrid destinations={destinations} />
      </div>
    </div>
  )
}