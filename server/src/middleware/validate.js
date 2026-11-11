export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) return res.status(400).json({ message: 'Please check the submitted information.', errors: result.error.flatten().fieldErrors })
    req.validatedBody = result.data
    next()
  }
}