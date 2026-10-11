import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, '.amplify-hosting');
await rm(output, { recursive: true, force: true });
const compute = resolve(output, 'compute/default');
await mkdir(compute, { recursive: true });
await cp(resolve(root, 'client/dist'), resolve(output, 'static'), { recursive: true });
await cp(resolve(root, 'client/dist'), resolve(compute, 'client/dist'), { recursive: true });
await cp(resolve(root, 'server/dist'), resolve(compute, 'server/dist'), {
  recursive: true,
  filter: source => !source.includes('__tests__'),
});
// Copy installed packages, never local environment files or credentials.
await cp(resolve(root, 'node_modules'), resolve(compute, 'node_modules'), {
  recursive: true,
  dereference: true,
  filter: source => !/[\\/]node_modules[\\/]careguide-(client|server)([\\/]|$)/.test(source),
});
await writeFile(resolve(compute, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
await writeFile(resolve(compute, 'index.js'), "process.env.PORT = '3000';\nawait import('./server/dist/server.js');\n");
await writeFile(resolve(output, 'deploy-manifest.json'), JSON.stringify({
  version: 1,
  framework: { name: 'express', version: '4.21.1' },
  routes: [
    { path: '/api/*', target: { kind: 'Compute', src: 'default' } },
    { path: '/*.*', target: { kind: 'Static' }, fallback: { kind: 'Compute', src: 'default' } },
    { path: '/*', target: { kind: 'Compute', src: 'default' } },
  ],
  computeResources: [{ name: 'default', runtime: 'nodejs22.x', entrypoint: 'index.js' }],
}, null, 2));
console.log('Amplify deployment bundle ready:', output);
