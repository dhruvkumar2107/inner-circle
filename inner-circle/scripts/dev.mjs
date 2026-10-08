import { spawn } from 'node:child_process'

const workspaces = ['client', 'server']
const children = workspaces.map(workspace => {
  const child = spawn(
    process.execPath,
    [process.env.npm_execpath, 'run', 'dev', '--workspace', workspace],
    { stdio: 'inherit', env: process.env, windowsHide: true },
  )
  child.on('exit', code => {
    if (code && code !== 0) {
      for (const other of children) if (other !== child) other.kill()
      process.exitCode = code
    }
  })
  return child
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    for (const child of children) child.kill(signal)
  })
}
