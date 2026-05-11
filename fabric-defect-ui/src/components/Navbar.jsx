import { NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 glass-card">

      {/* Logo / Brand */}
      <span className="font-display font-bold text-lg gradient-text">
        FabricAI
      </span>

      {/* Nav links */}
      <div className="flex items-center gap-8">
        {[
          { label: 'Home',     to: '/'          },
          { label: 'Journey',  to: '/journey'   },
          { label: 'Dashboard',to: '/dashboard' },
        ].map(({ label, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `font-body text-sm transition-colors duration-200 ${
                isActive
                  ? 'text-primary font-medium'
                  : 'text-text-muted hover:text-text-primary'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </div>

    </nav>
  )
}