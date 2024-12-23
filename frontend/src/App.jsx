
// Import our DogDashboard component
// Note: Make sure the path matches where you created your DogDashboard.jsx file
import DogDashboard from './DogDashboard.jsx'

// Create the App component
// We're keeping it simple - it just renders our dashboard
function App() {
  return (
    <div className="App">
      <DogDashboard />
    </div>
  )
}

// Export the component so it can be used in main.jsx
export default App