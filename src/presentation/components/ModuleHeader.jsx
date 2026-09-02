export default function ModuleHeader({ icon: Icon, eyebrow, italic, title, description }) {
  return (
    <header className="text-center mb-10 space-y-3">
      {Icon && (
        <div className="flex justify-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(150deg, rgba(255,255,255,0.92) 0%, rgba(243,197,190,0.45) 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 8px 24px -8px rgba(184,117,96,0.20)',
              border: '1px solid rgba(255,255,255,0.7)',
            }}
          >
            <Icon size={42} />
          </div>
        </div>
      )}
      {eyebrow && (
        <p className="font-body text-[11px] uppercase tracking-[0.3em] text-pato-coral/85">
          {eyebrow}
        </p>
      )}
      <h1 className="font-display text-4xl md:text-5xl font-medium text-pato-agua leading-[1.05]">
        {italic && <span className="italic font-light">{italic} </span>}
        {title}
      </h1>
      {description && (
        <p className="font-body text-sm text-pato-junco max-w-md mx-auto pt-1">
          {description}
        </p>
      )}
    </header>
  )
}
