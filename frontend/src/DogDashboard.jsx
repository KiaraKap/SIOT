import { useState, useEffect } from 'react';
import { LineChart, XAxis, YAxis, Tooltip, Line, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card';
import { Alert, AlertTitle } from './components/ui/alert';

const DogDashboard = () => {
  const [dogState, setDogState] = useState({
    location: 'unknown',
    lastFeedingTime: null,
    feedingCount: 0
  });

  const [history, setHistory] = useState([]);

  const fetchDogState = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/dog-state');
      const data = await response.json();
      setDogState(data);
    } catch (error) {
      console.error('Error fetching dog state:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/history');
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  useEffect(() => {
    fetchDogState();
    fetchHistory();
    const interval = setInterval(fetchDogState, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-center items-center w-full">
      <div className="w-full max-w-4xl px-4">
        <h1 className="text-3xl font-bold mb-8">Dog Activity Dashboard</h1>
        
        {/* Current Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Current Location</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className={dogState.location === 'in_crib' ? 'bg-green-50' : 'bg-yellow-50'}>
                <AlertTitle>
                  {dogState.location === 'in_crib' ? '🛏️ In Crib' : '🚶‍♂️ Away'}
                </AlertTitle>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Feedings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2">{dogState.feedingCount}</div>
              <div className="text-gray-500">
                Last fed: {dogState.lastFeedingTime ? new Date(dogState.lastFeedingTime).toLocaleTimeString() : 'No data'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Historical Data */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>7-Day Feeding History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="feedingCount" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {history.slice(0, 5).map((day, index) => (
                <div key={index} className="border-b pb-2">
                  <div className="font-semibold">{day.date}</div>
                  <div className="text-sm text-gray-500">
                    Fed {day.feedingCount} times
                    {day.feedingTimes.map(time => ` at ${time}`).join(', ')}
                  </div>
                  <div className="text-sm text-gray-500">
                    Location changed {day.locationChanges} times
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DogDashboard;