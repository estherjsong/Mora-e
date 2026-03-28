/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  safelist: [
    'bg-indigo-100', 'bg-indigo-200', 'bg-indigo-500', 'bg-indigo-600',
    'bg-purple-100', 'bg-purple-200', 'bg-purple-500', 'bg-purple-600',
    'bg-emerald-100', 'bg-emerald-200', 'bg-emerald-500', 'bg-emerald-600',
    'bg-amber-100', 'bg-amber-200', 'bg-amber-500', 'bg-amber-600',
    'bg-rose-100', 'bg-rose-200', 'bg-rose-500', 'bg-rose-600',
    'bg-sky-100', 'bg-sky-200', 'bg-sky-500', 'bg-sky-600',
    'bg-teal-100', 'bg-teal-200', 'bg-teal-500', 'bg-teal-600',
    'bg-pink-100', 'bg-pink-200', 'bg-pink-500', 'bg-pink-600',
    'border-indigo-300', 'border-purple-300', 'border-emerald-300', 'border-amber-300',
    'border-rose-300', 'border-sky-300', 'border-teal-300', 'border-pink-300',
    'text-indigo-700', 'text-purple-700', 'text-emerald-700', 'text-amber-700',
    'text-rose-700', 'text-sky-700', 'text-teal-700', 'text-pink-700',
    'text-indigo-800', 'text-purple-800', 'text-emerald-800', 'text-amber-800',
    'text-rose-800', 'text-sky-800', 'text-teal-800', 'text-pink-800',
    'bg-opacity-20', 'bg-opacity-40', 'bg-opacity-60',
  ],
  theme: {
  	extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}