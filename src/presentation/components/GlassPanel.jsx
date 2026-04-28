export const glassStyle = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.35) 100%)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.6)',
  boxShadow: '0 8px 32px -8px rgba(184, 117, 96, 0.15), inset 0 1px 0 rgba(255,255,255,0.5)',
}

export default function GlassPanel({ as: Tag = 'div', className = '', style, children, ...rest }) {
  return (
    <Tag className={`rounded-3xl ${className}`} style={{ ...glassStyle, ...style }} {...rest}>
      {children}
    </Tag>
  )
}
