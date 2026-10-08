export const errorHandler = (err: any, req: any, res: any, next: any) => {
  console.error(err.message)
  res.status(500).json({ error: 'Internal Server Error' })
}