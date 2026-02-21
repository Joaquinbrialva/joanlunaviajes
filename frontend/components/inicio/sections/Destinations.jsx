import CollageGrid from "../ui/CollageGrid";
import destinations from '@/mocks/mock_destinations_informative.json';
export default function Destinations() {
  return (
    <CollageGrid destinations={destinations} />
  )
}