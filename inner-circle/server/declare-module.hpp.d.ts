declare module 'hpp' {
  const hpp: (options: { whitelist?: string[] }) => import('express').ErrorRequestHandler;
  export default hpp;
}