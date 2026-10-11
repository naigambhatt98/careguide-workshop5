import app from './app.js';
import { config } from './config.js';

const port = config.port;

app.listen(port, () => {
  console.log(`CareGuide server running on http://localhost:${port}`);
});
