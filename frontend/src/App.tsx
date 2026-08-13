import CarrierScreen from './CarrierScreen'
import ShipperScreen from './ShipperScreen'

function App() {
  if (window.location.pathname === '/carrier') {
    return <CarrierScreen />
  }

  return <ShipperScreen />
}

export default App
