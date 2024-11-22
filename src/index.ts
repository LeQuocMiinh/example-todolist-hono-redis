import { Hono } from 'hono'
import { typiaValidator } from '@hono/typia-validator';
import { validate } from './utils/validate.js';
import { testingMiddleWare } from './middlewares/index.js';
import routes from './routes/index.js';
import { serve } from '@hono/node-server';


const app = new Hono();

app.post('/test', testingMiddleWare, async (c) => {
  const data = await c.req.json();
  return c.json({ status: true, data: data });
});

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

routes(app);

serve({ ...app, port: 3000 }, info => {
  console.log(`Listening on http://localhost:${info.port}`)
})
