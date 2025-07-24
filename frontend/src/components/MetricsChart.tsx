import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import {
  Box,
  Card,
  CardContent,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress
} from '@mui/material';
import { monitoringService, HistoricalMetrics } from '../services/monitoring';

type Timeframe = '24h' | '7d' | '30d';

const MetricsChart: React.FC = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>('24h');
  const [data, setData] = useState<HistoricalMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const metrics = await monitoringService.getHistoricalMetrics(timeframe);
        setData(metrics);
      } catch (err) {
        setError('Failed to fetch historical metrics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe]);

  const handleTimeframeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newTimeframe: Timeframe | null
  ) => {
    if (newTimeframe !== null) {
      setTimeframe(newTimeframe);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const formatTooltipValue = (value: number, name: string): [string, string] => {
    if (name === 'metrics.abuse_count') {
      return [value.toString(), 'Abuse Count'];
    }
    return [`${(value * 100).toFixed(1)}%`, name.replace('metrics.', '').replace('_', ' ').toUpperCase()];
  };

  const tooltipProps: TooltipProps<number, string> = {
    labelFormatter: (timestamp: string) => new Date(timestamp).toLocaleString(),
    formatter: formatTooltipValue
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Historical Metrics</Typography>
          <ToggleButtonGroup
            value={timeframe}
            exclusive
            onChange={handleTimeframeChange}
            size="small"
          >
            <ToggleButton value="24h">24h</ToggleButton>
            <ToggleButton value="7d">7d</ToggleButton>
            <ToggleButton value="30d">30d</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Box height={400}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(timestamp: string) => {
                  const date = new Date(timestamp);
                  if (timeframe === '24h') {
                    return date.toLocaleTimeString();
                  } else if (timeframe === '7d') {
                    return date.toLocaleDateString();
                  } else {
                    return date.toLocaleDateString();
                  }
                }}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                tickFormatter={(value: number) => `${(value * 100).toFixed(1)}%`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(value: number) => value.toString()}
              />
              <Tooltip {...tooltipProps} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="metrics.session_restart_rate"
                name="Session Restart Rate"
                stroke="#8884d8"
                dot={false}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="metrics.delivery_failure_rate"
                name="Delivery Failure Rate"
                stroke="#82ca9d"
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="metrics.abuse_count"
                name="Abuse Count"
                stroke="#ff7300"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MetricsChart; 