import { useEffect, useState } from "react";
import { Box, Button, Container, Typography } from "@mui/material";
import { logEvent } from "./utils/log.js";

function App() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    logEvent("info", "page", "Priority Notification App loaded");
  }, []);

  const handleNotify = async () => {
    const nextCount = count + 1;
    setCount(nextCount);
    await logEvent(
      "info",
      "component",
      `Notification button clicked ${nextCount} times`
    );
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: "grid", gap: 2 }}>
        <Typography variant="h4" component="h1">
          Priority Notification App
        </Typography>
        <Typography color="text.secondary">
          Track user interactions using the logging middleware from the first
          render.
        </Typography>
        <Button variant="contained" onClick={handleNotify}>
          Send Test Notification
        </Button>
        <Typography variant="body2" color="text.secondary">
          Click count: {count}
        </Typography>
      </Box>
    </Container>
  );
}

export default App;
