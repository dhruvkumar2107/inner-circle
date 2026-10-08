export const auditLogger = (req: any, res: any, next: any) => {
  console.log(`Audit: ${req.method} ${req.path}`)
  next()
}