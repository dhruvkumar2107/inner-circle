/**
 * Convenience launcher (used by run.bat / start-server.bat).
 * Loads the TypeScript API through ts-node. Prefer `npm run dev` from the
 * project root, which starts the client and API together.
 */
require('dotenv').config()
require('ts-node').register({ transpileOnly: true, project: require('path').join(__dirname, 'tsconfig.json') })
require('./src/index.ts')
